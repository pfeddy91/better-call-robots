import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Globe, Type, FileText, Edit, Trash2, Plus, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface BriefingDocument {
  id: string;
  name: string;
  type: 'url' | 'file' | 'text';
  content: string | File;
  tag: string;
  uploadedAt: string;
  uploadedBy: string;
  processed?: {
    chunks: string[];
    metadata: Record<string, any>;
  };
}

const BriefingRoom = () => {
  const [documents, setDocuments] = useState<BriefingDocument[]>([]);
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<BriefingDocument | null>(null);
  
  // Form states
  const [urlForm, setUrlForm] = useState({ url: "", name: "", tag: "" });
  const [textForm, setTextForm] = useState({ name: "", content: "", tag: "" });
  const [dragActive, setDragActive] = useState(false);

  // Load documents from localStorage on mount
  useEffect(() => {
    const savedDocs = localStorage.getItem('briefing_documents');
    if (savedDocs) {
      try {
        setDocuments(JSON.parse(savedDocs));
      } catch (error) {
        console.warn('Failed to parse briefing documents:', error);
      }
    }
  }, []);

  // Save documents to localStorage whenever documents change
  useEffect(() => {
    localStorage.setItem('briefing_documents', JSON.stringify(documents));
  }, [documents]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleFileUpload = async (files: File[]) => {
    for (const file of files) {
      if (file.size > 21 * 1024 * 1024) { // 21MB limit
        alert(`File ${file.name} is too large. Maximum size is 21MB.`);
        continue;
      }

      const processed = await processDocument(file);
      
      const newDoc: BriefingDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: 'file',
        content: file,
        tag: 'Untagged',
        uploadedAt: new Date().toLocaleDateString(),
        uploadedBy: 'Current User', // This would be dynamic in a real app
        processed
      };

      setDocuments(prev => [...prev, newDoc]);
    }
  };

  const handleAddUrl = async () => {
    if (!urlForm.url.trim() || !urlForm.name.trim()) return;

    try {
      const processed = await processUrl(urlForm.url);
      
      const newDoc: BriefingDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: urlForm.name,
        type: 'url',
        content: urlForm.url,
        tag: urlForm.tag || 'Untagged',
        uploadedAt: new Date().toLocaleDateString(),
        uploadedBy: 'Current User',
        processed
      };

      setDocuments(prev => [...prev, newDoc]);
      setUrlForm({ url: "", name: "", tag: "" });
      setModalOpen(null);
    } catch (error) {
      console.error('Error processing URL:', error);
      alert('Failed to process URL. Please try again.');
    }
  };

  const handleAddText = async () => {
    if (!textForm.name.trim() || !textForm.content.trim()) return;

    const processed = await processText(textForm.content);
    
    const newDoc: BriefingDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: textForm.name,
      type: 'text',
      content: textForm.content,
      tag: textForm.tag || 'Untagged',
      uploadedAt: new Date().toLocaleDateString(),
      uploadedBy: 'Current User',
      processed
    };

    setDocuments(prev => [...prev, newDoc]);
    setTextForm({ name: "", content: "", tag: "" });
    setModalOpen(null);
  };

  const handleEditDocument = (doc: BriefingDocument) => {
    setEditingDoc(doc);
    if (doc.type === 'url') {
      setUrlForm({
        url: doc.content as string,
        name: doc.name,
        tag: doc.tag
      });
    } else if (doc.type === 'text') {
      setTextForm({
        name: doc.name,
        content: doc.content as string,
        tag: doc.tag
      });
    }
    setModalOpen(doc.type);
  };

  const handleUpdateDocument = () => {
    if (!editingDoc) return;

    setDocuments(prev => prev.map(doc => {
      if (doc.id === editingDoc.id) {
        if (editingDoc.type === 'url') {
          return { ...doc, name: urlForm.name, content: urlForm.url, tag: urlForm.tag };
        } else if (editingDoc.type === 'text') {
          return { ...doc, name: textForm.name, content: textForm.content, tag: textForm.tag };
        }
      }
      return doc;
    }));

    setEditingDoc(null);
    setModalOpen(null);
    setUrlForm({ url: "", name: "", tag: "" });
    setTextForm({ name: "", content: "", tag: "" });
  };

  const handleDeleteDocument = (docId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
    }
  };

  const closeModal = () => {
    setModalOpen(null);
    setEditingDoc(null);
    setUrlForm({ url: "", name: "", tag: "" });
    setTextForm({ name: "", content: "", tag: "" });
  };

  // Document processing functions for RAG
  const processDocument = async (file: File): Promise<BriefingDocument['processed']> => {
    // For now, we'll do basic text extraction
    // In a real implementation, this would use proper document parsers
    try {
      let text = '';
      
      if (file.type === 'text/plain') {
        text = await file.text();
      } else if (file.type === 'text/html') {
        text = await file.text();
        // Basic HTML tag removal
        text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      } else {
        // For other file types, we'd integrate with document parsing libraries
        text = `[Binary file: ${file.name}] - Content extraction not implemented for this file type.`;
      }

      return {
        chunks: chunkText(text),
        metadata: {
          fileSize: file.size,
          fileType: file.type,
          fileName: file.name
        }
      };
    } catch (error) {
      console.error('Error processing document:', error);
      return {
        chunks: [`Error processing ${file.name}`],
        metadata: { error: 'Processing failed' }
      };
    }
  };

  const processUrl = async (url: string): Promise<BriefingDocument['processed']> => {
    try {
      // In a real implementation, this would use a web scraping service
      // For now, we'll simulate it
      const mockContent = `Content from ${url} - In a real implementation, this would scrape and clean the webpage content.`;
      
      return {
        chunks: chunkText(mockContent),
        metadata: {
          url,
          scrapedAt: new Date().toISOString(),
          title: `Content from ${new URL(url).hostname}`
        }
      };
    } catch (error) {
      console.error('Error processing URL:', error);
      return {
        chunks: [`Error processing URL: ${url}`],
        metadata: { error: 'URL processing failed' }
      };
    }
  };

  const processText = async (text: string): Promise<BriefingDocument['processed']> => {
    return {
      chunks: chunkText(text),
      metadata: {
        wordCount: text.split(/\s+/).length,
        characterCount: text.length
      }
    };
  };

  const chunkText = (text: string, chunkSize: number = 1000): string[] => {
    // Simple text chunking for RAG
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }
    
    return chunks.length > 0 ? chunks : [text];
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'url': return <Globe className="w-4 h-4" />;
      case 'text': return <Type className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'url': return 'bg-blue-100 text-blue-800';
      case 'text': return 'bg-green-100 text-green-800';
      case 'file': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex-1 bg-background-secondary">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-header text-text-primary mb-2">The Briefing Room</h1>
          <p className="text-standard text-text-secondary">
            Upload and manage knowledge base documents that your voice agents can reference during calls.
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {/* Main Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                dragActive 
                  ? 'border-shape-blue bg-shape-blue/5' 
                  : 'border-border hover:border-shape-blue/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-text-secondary" />
              <h3 className="text-standard font-medium mb-2">Drag and Drop, Upload a file or a URL</h3>
              <p className="text-small text-text-secondary mb-4">PDF, DOCX, DOC, PPTX, PPT, or TXT</p>
              
              {/* Action Buttons */}
              <div className="flex justify-center gap-4 mt-6">
                <Button 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalOpen('url');
                  }}
                  className="flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  Web site
                </Button>
                <Button 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalOpen('text');
                  }}
                  className="flex items-center gap-2"
                >
                  <Type className="w-4 h-4" />
                  Text
                </Button>
              </div>
            </div>

            <input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.html"
              onChange={(e) => e.target.files && handleFileUpload(Array.from(e.target.files))}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sub-header">All Files</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add folder
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No documents uploaded yet. Start by uploading your first document above.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead>Date created</TableHead>
                    <TableHead>Uploaded by</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded ${getDocumentTypeColor(doc.type)}`}>
                            {getDocumentIcon(doc.type)}
                          </div>
                          <span className="font-medium">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{doc.tag}</Badge>
                      </TableCell>
                      <TableCell className="text-text-secondary">{doc.uploadedAt}</TableCell>
                      <TableCell className="text-text-secondary">{doc.uploadedBy}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditDocument(doc)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* URL Modal */}
        <Dialog open={modalOpen === 'url'} onOpenChange={closeModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-shape-blue" />
                <DialogTitle className="text-sub-header">
                  {editingDoc ? 'Edit URL' : 'Add URL'}
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={urlForm.url}
                  onChange={(e) => setUrlForm(prev => ({ ...prev, url: e.target.value }))}
                  className="bg-second-grey border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url-name">Name</Label>
                <Input
                  id="url-name"
                  placeholder="Enter a name for this URL"
                  value={urlForm.name}
                  onChange={(e) => setUrlForm(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-second-grey border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url-tag">Tag</Label>
                <Input
                  id="url-tag"
                  placeholder="Enter a tag (optional)"
                  value={urlForm.tag}
                  onChange={(e) => setUrlForm(prev => ({ ...prev, tag: e.target.value }))}
                  className="bg-second-grey border-border"
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={editingDoc ? handleUpdateDocument : handleAddUrl}
                  className="bg-shape-blue text-white hover:bg-shape-blue/90"
                >
                  {editingDoc ? 'Update URL' : 'Add URL'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Text Modal */}
        <Dialog open={modalOpen === 'text'} onOpenChange={closeModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Type className="w-6 h-6 text-shape-blue" />
                <DialogTitle className="text-sub-header">
                  {editingDoc ? 'Edit Text' : 'Create Text'}
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="text-name">Text Name</Label>
                <Input
                  id="text-name"
                  placeholder="Enter a name for your text"
                  value={textForm.name}
                  onChange={(e) => setTextForm(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-second-grey border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="text-tag">Tag</Label>
                <Input
                  id="text-tag"
                  placeholder="Enter a tag (optional)"
                  value={textForm.tag}
                  onChange={(e) => setTextForm(prev => ({ ...prev, tag: e.target.value }))}
                  className="bg-second-grey border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="text-content">Text Content</Label>
                <Textarea
                  id="text-content"
                  placeholder="Enter your text content here"
                  value={textForm.content}
                  onChange={(e) => setTextForm(prev => ({ ...prev, content: e.target.value }))}
                  className="min-h-[200px] bg-second-grey border-border"
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={editingDoc ? handleUpdateDocument : handleAddText}
                  className="bg-shape-blue text-white hover:bg-shape-blue/90"
                >
                  {editingDoc ? 'Update Text' : 'Create Text'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BriefingRoom; 