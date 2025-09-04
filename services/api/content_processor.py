"""
Content Processing Service for BetterCallRobots
Handles web scraping, document processing, and RAG retrieval
"""

import asyncio
import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse, urljoin

import aiohttp
from bs4 import BeautifulSoup
import tiktoken
from dataclasses import dataclass

@dataclass
class ProcessedChunk:
    content: str
    metadata: Dict[str, Any]
    token_count: int

@dataclass
class ProcessedDocument:
    id: str
    chunks: List[ProcessedChunk]
    metadata: Dict[str, Any]
    total_tokens: int

class ContentProcessor:
    """
    Handles web scraping and document processing for RAG
    """
    
    def __init__(self):
        self.encoding = tiktoken.get_encoding("cl100k_base")  # GPT-4 encoding
        self.max_chunk_tokens = 500
        self.chunk_overlap = 50
    
    async def process_url(self, url: str, name: str = None, tag: str = "Untagged") -> ProcessedDocument:
        """
        Process a URL by scraping content and preparing for RAG
        """
        try:
            # 1. Scrape the webpage
            raw_content = await self._scrape_url(url)
            
            # 2. Extract main content
            clean_content = self._extract_main_content(raw_content)
            
            # 3. Create document metadata
            doc_metadata = {
                "url": url,
                "name": name or self._extract_title(raw_content),
                "tag": tag,
                "domain": urlparse(url).netloc,
                "scraped_at": datetime.now().isoformat(),
                "content_type": "webpage",
                "word_count": len(clean_content.split()),
                "char_count": len(clean_content)
            }
            
            # 4. Chunk the content
            chunks = self._chunk_content(clean_content, doc_metadata)
            
            # 5. Calculate total tokens
            total_tokens = sum(chunk.token_count for chunk in chunks)
            
            doc_id = f"doc_{int(datetime.now().timestamp())}_{hash(url) % 10000}"
            
            return ProcessedDocument(
                id=doc_id,
                chunks=chunks,
                metadata=doc_metadata,
                total_tokens=total_tokens
            )
            
        except Exception as e:
            # Return error document
            error_chunk = ProcessedChunk(
                content=f"Error processing URL {url}: {str(e)}",
                metadata={"error": True, "url": url},
                token_count=len(self.encoding.encode(f"Error processing URL {url}: {str(e)}"))
            )
            
            return ProcessedDocument(
                id=f"error_{int(datetime.now().timestamp())}",
                chunks=[error_chunk],
                metadata={"url": url, "error": str(e)},
                total_tokens=error_chunk.token_count
            )
    
    async def _scrape_url(self, url: str) -> str:
        """
        Scrape webpage content using aiohttp + BeautifulSoup
        For MVP - in production, use Playwright for JS-heavy sites
        """
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        timeout = aiohttp.ClientTimeout(total=30)
        
        async with aiohttp.ClientSession(timeout=timeout, headers=headers) as session:
            async with session.get(url) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}: Failed to fetch {url}")
                
                content = await response.text()
                return content
    
    def _extract_main_content(self, html: str) -> str:
        """
        Extract main content from HTML, removing navigation, ads, etc.
        """
        soup = BeautifulSoup(html, 'html.parser')
        
        # Remove unwanted elements
        for element in soup(['script', 'style', 'nav', 'header', 'footer', 
                           'aside', 'advertisement', '.ad', '#ad']):
            element.decompose()
        
        # Try to find main content areas
        main_content = None
        
        # Look for semantic HTML5 elements first
        for tag in ['main', 'article', '[role="main"]']:
            main_content = soup.select_one(tag)
            if main_content:
                break
        
        # Fallback to common content containers
        if not main_content:
            for selector in ['#main', '#content', '.content', '.main', '.post', '.article']:
                main_content = soup.select_one(selector)
                if main_content:
                    break
        
        # Use body as last resort
        if not main_content:
            main_content = soup.find('body')
        
        if not main_content:
            # Extract all text as fallback
            text = soup.get_text()
        else:
            text = main_content.get_text()
        
        # Clean up the text
        text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
        text = text.strip()
        
        return text
    
    def _extract_title(self, html: str) -> str:
        """
        Extract page title from HTML
        """
        soup = BeautifulSoup(html, 'html.parser')
        title_tag = soup.find('title')
        
        if title_tag:
            return title_tag.get_text().strip()
        
        # Fallback to first h1
        h1 = soup.find('h1')
        if h1:
            return h1.get_text().strip()
        
        return "Untitled Document"
    
    def _chunk_content(self, content: str, doc_metadata: Dict[str, Any]) -> List[ProcessedChunk]:
        """
        Split content into chunks suitable for RAG
        """
        if not content.strip():
            return []
        
        # Encode the content to work with tokens
        tokens = self.encoding.encode(content)
        
        if len(tokens) <= self.max_chunk_tokens:
            # Content is small enough to be a single chunk
            return [ProcessedChunk(
                content=content,
                metadata={**doc_metadata, "chunk_index": 0, "total_chunks": 1},
                token_count=len(tokens)
            )]
        
        chunks = []
        chunk_index = 0
        
        # Split into overlapping chunks
        for i in range(0, len(tokens), self.max_chunk_tokens - self.chunk_overlap):
            chunk_tokens = tokens[i:i + self.max_chunk_tokens]
            chunk_text = self.encoding.decode(chunk_tokens)
            
            # Try to split at sentence boundaries
            chunk_text = self._adjust_chunk_boundary(chunk_text)
            
            chunks.append(ProcessedChunk(
                content=chunk_text,
                metadata={
                    **doc_metadata,
                    "chunk_index": chunk_index,
                    "total_chunks": -1  # Will be updated below
                },
                token_count=len(chunk_tokens)
            ))
            
            chunk_index += 1
        
        # Update total_chunks in metadata
        for chunk in chunks:
            chunk.metadata["total_chunks"] = len(chunks)
        
        return chunks
    
    def _adjust_chunk_boundary(self, text: str) -> str:
        """
        Adjust chunk boundary to end at sentence boundary when possible
        """
        if len(text) < 50:  # Too short to adjust
            return text
        
        # Look for sentence endings in the last 100 characters
        last_part = text[-100:]
        sentence_endings = ['.', '!', '?', '\n\n']
        
        best_split = -1
        for ending in sentence_endings:
            pos = last_part.rfind(ending)
            if pos > 20:  # Don't split too close to the end
                best_split = max(best_split, pos)
        
        if best_split > 0:
            return text[:len(text) - 100 + best_split + 1].strip()
        
        return text.strip()

class SimpleRAGRetriever:
    """
    Simple in-memory RAG retrieval for MVP
    In production, use vector database like Chroma or Pinecone
    """
    
    def __init__(self):
        self.documents: Dict[str, ProcessedDocument] = {}
        self.chunks: List[ProcessedChunk] = []
    
    def add_document(self, doc: ProcessedDocument):
        """Add processed document to the retrieval system"""
        self.documents[doc.id] = doc
        self.chunks.extend(doc.chunks)
    
    def search(self, query: str, top_k: int = 3) -> List[ProcessedChunk]:
        """
        Simple keyword-based search
        In production, use semantic/vector search
        """
        query_lower = query.lower()
        query_words = set(query_lower.split())
        
        # Score chunks based on keyword overlap
        scored_chunks = []
        
        for chunk in self.chunks:
            content_lower = chunk.content.lower()
            content_words = set(content_lower.split())
            
            # Simple scoring: word overlap + exact phrase matches
            word_overlap = len(query_words.intersection(content_words))
            phrase_matches = content_lower.count(query_lower)
            
            score = word_overlap + (phrase_matches * 2)
            
            if score > 0:
                scored_chunks.append((score, chunk))
        
        # Sort by score and return top-k
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        return [chunk for _, chunk in scored_chunks[:top_k]]
    
    def get_document_stats(self) -> Dict[str, Any]:
        """Get statistics about indexed documents"""
        return {
            "total_documents": len(self.documents),
            "total_chunks": len(self.chunks),
            "total_tokens": sum(chunk.token_count for chunk in self.chunks),
            "domains": list(set(chunk.metadata.get("domain", "unknown") for chunk in self.chunks))
        }

# Global retriever instance (in production, use dependency injection)
rag_retriever = SimpleRAGRetriever()
content_processor = ContentProcessor() 