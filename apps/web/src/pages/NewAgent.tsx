import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import GradientButton from "@/components/ui/gradient-button";

import { ArrowLeft, PhoneIncoming, PhoneOutgoing, Globe, MessageSquare, Settings, ChevronDown, ChevronUp, Phone, Plus, Search, Play, FileText, Type, Upload, User, ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { startCall, endCall, mute, getState } from "@/lib/voice";

const NewAgent = () => {
  const navigate = useNavigate();
  
  // Unified state for entire agent configuration
  const [agentConfig, setAgentConfig] = useState({
    name: "New Assistant",
    keyObjective: "",
    type: null as "inbound" | "outbound" | null,
    language: "en",
    welcomeMessage: "Hello! How can I help you today?",
    systemPrompt: "",
    settings: {
      endCall: false,
      detectLanguage: false,
      skipTurn: false,
      transferToAgent: false,
      transferToNumber: false,
      playKeypadTone: false,
      voicemailDetection: false,
    }
  });

  // State for API interactions
  const [isCreating, setIsCreating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [muted, setMuted] = useState(false);

  // State for collapsible sections
  const [openSections, setOpenSections] = useState({
    agentInitiation: true,
    agentInstructions: true,
    knowledgeBase: true,
    advancedSettings: true,
  });

  // State for knowledge base - replace with document selection
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [briefingDocuments, setBriefingDocuments] = useState<any[]>([]);

  // Sample agent data
  const [existingAgents] = useState([
    {
      id: "1",
      name: "Test Name",
      objective: "Customer support assistant for handling billing inquiries and account management",
      type: "inbound" as const,
    },
    {
      id: "2", 
      name: "Riley",
      objective: "Sales assistant for lead qualification and appointment scheduling",
      type: "outbound" as const,
    },
    {
      id: "3",
      name: "Alex Support",
      objective: "Technical support specialist for troubleshooting software issues",
      type: "inbound" as const,
    }
  ]);

  // Selected agent state
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    existingAgents.length > 0 ? existingAgents[0].id : null
  );

  // Show main content state
  const [showMainContent, setShowMainContent] = useState(existingAgents.length > 0);

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "it", name: "Italian", flag: "🇮🇹" },
    { code: "pt", name: "Portuguese", flag: "🇵🇹" },
    { code: "zh", name: "Chinese", flag: "🇨🇳" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
    { code: "ko", name: "Korean", flag: "🇰🇷" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
  ];

  // Auto-save draft functionality
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('draft_agent', JSON.stringify(agentConfig));
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [agentConfig]);

  // Load draft on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('draft_agent');
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setAgentConfig(parsedDraft);
      } catch (error) {
        console.warn('Failed to parse saved draft:', error);
        localStorage.removeItem('draft_agent');
      }
    }
  }, []);

  // Load briefing room documents
  useEffect(() => {
    const savedDocs = localStorage.getItem('briefing_documents');
    if (savedDocs) {
      try {
        setBriefingDocuments(JSON.parse(savedDocs));
      } catch (error) {
        console.warn('Failed to parse briefing documents:', error);
      }
    }
  }, []);

  const handleBack = () => {
    navigate("/build");
  };

  const handleBuildNewAgent = () => {
    setShowMainContent(true);
    setSelectedAgentId(null);
    // Reset form to default values for new agent
    setAgentConfig({
      name: "New Assistant",
      keyObjective: "",
      type: null,
      language: "en",
      welcomeMessage: "Hello! How can I help you today?",
      systemPrompt: "",
      settings: {
        endCall: false,
        detectLanguage: false,
        skipTurn: false,
        transferToAgent: false,
        transferToNumber: false,
        playKeypadTone: false,
        voicemailDetection: false,
      }
    });
  };

  const handleStartTalk = async () => {
    try {
      setCallStatus("connecting");
      await startCall();
      setCallStatus("connected");
    } catch (e) {
      console.error("Failed to start call", e);
      setCallStatus("error");
      setApiError("Failed to start call. Check network and token endpoint.");
    }
  };

  const handleHangUp = () => {
    try { endCall(); } catch {}
    setCallStatus("idle");
    setMuted(false);
  };

  const handleToggleMute = () => {
    const next = !muted;
    mute(next);
    setMuted(next);
  };

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setShowMainContent(true);
    const agent = existingAgents.find((a) => a.id === agentId);
    if (agent) {
      setAgentConfig((prev) => ({
        ...prev,
        name: agent.name,
        type: agent.type,
        systemPrompt: `This agent's main objective is: ${agent.objective}.`,
        // NOTE: In a real app, you'd load the full config from an API
      }));
    }
  };

  const handleCreate = async () => {
    if (!agentConfig.type) return;

    setIsCreating(true);
    setApiError(null);

    // Prepare agent configuration for backend API
    const agentPayload = {
      name: agentConfig.name,
      type: agentConfig.type,
      language: agentConfig.language,
      welcomeMessage: agentConfig.welcomeMessage,
      systemPrompt: agentConfig.systemPrompt,
      settings: agentConfig.settings,
      knowledgeBase: selectedDocuments, // Include selected documents
      createdBy: "user" // This could be dynamic based on authentication
    };

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    try {
      console.log('Creating agent with payload:', agentPayload);
      
      /**
       * API Integration Documentation:
       * 
       * Expected Payload Format:
       * {
       *   name: string,
       *   type: "inbound" | "outbound",
       *   language: string,
       *   welcomeMessage: string,
       *   systemPrompt: string,
       *   settings: {
       *     endCall: boolean,
       *     detectLanguage: boolean,
       *     skipTurn: boolean,
       *     transferToAgent: boolean,
       *     transferToNumber: boolean,
       *     playKeypadTone: boolean,
       *     voicemailDetection: boolean
       *   },
       *   createdBy: string
       * }
       * 
       * Expected Response:
       * {
       *   success: true,
       *   agentId: string,
       *   message: string
       * }
       * 
       * Error Response:
       * {
       *   success: false,
       *   error: string
       * }
       */
      const response = await fetch(`${API_BASE_URL}/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentPayload),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create agent');
      }

      // Agent created successfully - prepare data for finalized page
      const agentData = {
        id: data.agentId, // Use backend-generated ID
        ...agentPayload,
        createdAt: new Date().toLocaleString(),
        fullCreatedAt: new Date().toISOString(),
      };

      // Save to localStorage as backup (optional)
      const existingAgents = JSON.parse(localStorage.getItem('agents') || '[]');
      const updatedAgents = [...existingAgents, agentData];
      localStorage.setItem('agents', JSON.stringify(updatedAgents));

      // Clear draft
      localStorage.removeItem('draft_agent');

      // Navigate to finalized agent with backend-generated agent data
      navigate("/build/finalized", { state: { agentData } });

    } catch (error) {
      console.error('Error creating agent:', error);
      
      /**
       * Error Handling Strategy:
       * 1. Display user-friendly error message
       * 2. Keep user on current page to retry
       * 3. Log detailed error for debugging
       * 4. Fallback to localStorage save if needed (optional)
       */
      setApiError(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred while creating the agent. Please try again.'
      );

      // Optional: Fallback to localStorage-only creation
      // Uncomment the following lines if you want to allow offline creation
      /*
      console.log('Falling back to localStorage-only creation');
      const fallbackAgentData = {
        id: `agent_${Date.now()}`,
        ...agentPayload,
        createdAt: new Date().toLocaleString(),
        fullCreatedAt: new Date().toISOString(),
      };
      
      const existingAgents = JSON.parse(localStorage.getItem('agents') || '[]');
      const updatedAgents = [...existingAgents, fallbackAgentData];
      localStorage.setItem('agents', JSON.stringify(updatedAgents));
      localStorage.removeItem('draft_agent');
      navigate("/build/finalized", { state: { agentData: fallbackAgentData } });
      */
    } finally {
      setIsCreating(false);
    }
  };

  const updateAgentConfig = (field: string, value: any) => {
    setAgentConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateSettings = (key: string, value: boolean) => {
    setAgentConfig(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value
      }
    }));
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  // Replace knowledge base handlers with document selection handlers
  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleSelectAllDocuments = () => {
    if (selectedDocuments.length === briefingDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(briefingDocuments.map(doc => doc.id));
    }
  };

  const isValid = agentConfig.type !== null;

  return (
    <div className="flex h-screen bg-background-secondary text-text-primary">
      {/* API Error Display */}
      {apiError && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          <div className="flex items-center gap-2">
            <div className="text-small font-medium">Error creating agent:</div>
          </div>
          <div className="text-small mt-1">{apiError}</div>
          <button 
            onClick={() => setApiError(null)}
            className="text-xs underline mt-2 hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Vertical Navigation */}
      <aside className="w-80 bg-second-grey border-r border-border flex-shrink-0 overflow-y-auto">
        <div className="px-6 py-6">
          {/* Brand Spacer - to align with AppSidebar MAIN section */}
          <div className="mb-0">
            {/* This div provides the same spacing as the brand section in AppSidebar */}
          </div>
          
          {/* Section Title */}
          <h2 className="text-sub-header text-text-primary mb-6">Agents</h2>
          
          {/* Build New Agent Button */}
          <GradientButton 
            onClick={handleBuildNewAgent}
            className="mb-6"
            fullWidth={true}
          >
            <Plus className="w-4 h-4" />
            <span>Build New Agent</span>
          </GradientButton>
          
          {/* Search Agents */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input 
              placeholder="Search Agents"
              className="pl-10 bg-background-secondary border-border text-text-primary"
            />
          </div>
          
          {/* Agents List */}
          <div className="space-y-3">
            {existingAgents.map((agent) => (
              <Card 
                key={agent.id}
                className={`cursor-pointer transition-all hover:shadow-md border-0 ${
                  selectedAgentId === agent.id 
                    ? "bg-shape-blue/10 border border-shape-blue/30 shadow-sm" 
                    : "bg-background-secondary hover:bg-background-secondary/80"
                }`}
                onClick={() => handleSelectAgent(agent.id)}
              >
                <CardContent className="p-4">
                  <h3 className="text-standard font-medium text-text-primary mb-1">
                    {agent.name}
                  </h3>
                  <p className="text-small text-text-secondary line-clamp-2">
                    {agent.objective}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-background-secondary px-8 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            {/* Left side - Editable Agent Name */}
            <div className="group flex items-center">
              <input
                type="text"
                value={agentConfig.name}
                onChange={(e) => updateAgentConfig('name', e.target.value)}
                className="text-sub-header text-text-primary bg-transparent border-none outline-none focus:bg-background-secondary/80 group-hover:bg-background-secondary/80 px-2 py-1 rounded"
              />
            </div>

            {/* Right side - Action Buttons */}
            <div className="flex items-center gap-3">
              <GradientButton>
                <Play className="w-4 h-4" />
                <span>Test</span>
              </GradientButton>
              {callStatus !== "connected" ? (
                <GradientButton onClick={handleStartTalk} disabled={callStatus === "connecting"}>
                  <Phone className="w-4 h-4" />
                  <span>{callStatus === "connecting" ? "Connecting..." : "Talk to Agent"}</span>
                </GradientButton>
              ) : (
                <div className="flex items-center gap-2">
                  <GradientButton onClick={handleHangUp}>
                    <Phone className="w-4 h-4" />
                    <span>Hang up</span>
                  </GradientButton>
                  <Button variant="outline" onClick={handleToggleMute}>
                    {muted ? "Unmute" : "Mute"}
                  </Button>
                </div>
              )}
              <GradientButton>
                <span>Publish Agent</span>
              </GradientButton>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {showMainContent ? (
            <main className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">
              {/* Agent Initiation */}
              <Card>
                <Collapsible open={openSections.agentInitiation} onOpenChange={() => toggleSection('agentInitiation')}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer bg-second-grey hover:bg-muted transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-text-primary" />
                          <CardTitle className="text-sub-header text-text-primary">Agent Initiation</CardTitle>
                        </div>
                        {openSections.agentInitiation ? 
                          <ChevronUp className="w-5 h-5 text-text-secondary" /> : 
                          <ChevronDown className="w-5 h-5 text-text-secondary" />
                        }
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="bg-background-secondary space-y-4 pt-6">
                      <div className="space-y-2">
                        <Label htmlFor="agentName" className="text-standard font-medium text-text-primary">Name</Label>
                        <Input
                          id="agentName"
                          placeholder="Enter agent name..."
                          value={agentConfig.name}
                          onChange={(e) => updateAgentConfig('name', e.target.value)}
                          className="bg-second-grey border-border text-text-primary"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="keyObjective" className="text-standard font-medium text-text-primary">Key Objective</Label>
                        <Input
                          id="keyObjective"
                          placeholder="eg. to contact customers who have started signup but not completed registration"
                          value={agentConfig.keyObjective}
                          onChange={(e) => updateAgentConfig('keyObjective', e.target.value)}
                          className="bg-second-grey border-border text-text-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-standard font-medium text-text-primary">Agent Type</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div 
                            onClick={() => updateAgentConfig('type', 'inbound')}
                            className={`p-6 rounded-lg border-2 cursor-pointer transition-all hover:border-shape-blue/50 ${
                              agentConfig.type === 'inbound' 
                                ? 'border-shape-blue bg-shape-blue/5' 
                                : 'border-border bg-second-grey hover:bg-second-grey/80'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <PhoneIncoming className="w-6 h-6 text-shape-blue" />
                              <h3 className="text-sub-header font-medium text-text-primary">Inbound</h3>
                            </div>
                            <p className="text-small text-text-secondary">Handles incoming calls from customers seeking support or information</p>
                          </div>
                          
                          <div 
                            onClick={() => updateAgentConfig('type', 'outbound')}
                            className={`p-6 rounded-lg border-2 cursor-pointer transition-all hover:border-shape-blue/50 ${
                              agentConfig.type === 'outbound' 
                                ? 'border-shape-blue bg-shape-blue/5' 
                                : 'border-border bg-second-grey hover:bg-second-grey/80'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <PhoneOutgoing className="w-6 h-6 text-shape-blue" />
                              <h3 className="text-sub-header font-medium text-text-primary">Outbound</h3>
                            </div>
                            <p className="text-small text-text-secondary">Makes calls to prospects for sales, follow-ups, or notifications</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Agent Instructions */}
              <Card>
                <Collapsible open={openSections.agentInstructions} onOpenChange={() => toggleSection('agentInstructions')}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer bg-second-grey hover:bg-muted transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-5 h-5 text-text-primary" />
                          <CardTitle className="text-sub-header text-text-primary">Agent Instructions</CardTitle>
                        </div>
                        {openSections.agentInstructions ? 
                          <ChevronUp className="w-5 h-5 text-text-secondary" /> : 
                          <ChevronDown className="w-5 h-5 text-text-secondary" />
                        }
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="bg-background-secondary space-y-4 pt-6">
                      <div className="space-y-2">
                        <Label htmlFor="language" className="text-standard font-medium text-text-primary">Language</Label>
                        <Select value={agentConfig.language} onValueChange={(value) => updateAgentConfig('language', value)}>
                          <SelectTrigger className="bg-second-grey border-border text-text-primary">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.flag} {lang.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="welcomeMessage" className="text-standard font-medium text-text-primary">Welcome Message</Label>
                        <Textarea
                          id="welcomeMessage"
                          placeholder="Enter the initial greeting your agent will use..."
                          value={agentConfig.welcomeMessage}
                          onChange={(e) => updateAgentConfig('welcomeMessage', e.target.value)}
                          className="min-h-[100px] bg-second-grey border-border text-text-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="systemPrompt" className="text-standard font-medium text-text-primary">System Prompt</Label>
                        <Textarea
                          id="systemPrompt"
                          placeholder="Define your agent's personality, knowledge, and behavior guidelines..."
                          value={agentConfig.systemPrompt}
                          onChange={(e) => updateAgentConfig('systemPrompt', e.target.value)}
                          className="min-h-[200px] bg-second-grey border-border text-text-primary"
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Knowledge Base */}
              <Card>
                <Collapsible open={openSections.knowledgeBase} onOpenChange={() => toggleSection('knowledgeBase')}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer bg-second-grey hover:bg-muted transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-text-primary" />
                          <CardTitle className="text-sub-header text-text-primary">Knowledge Base</CardTitle>
                        </div>
                        {openSections.knowledgeBase ? 
                          <ChevronUp className="w-5 h-5 text-text-secondary" /> : 
                          <ChevronDown className="w-5 h-5 text-text-secondary" />
                        }
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="bg-background-secondary space-y-4 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-standard text-text-secondary">
                          Select documents from The Briefing Room for this agent to reference during calls.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open('/briefing-room', '_blank')}
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Manage Documents
                        </Button>
                      </div>

                      {briefingDocuments.length === 0 ? (
                        <div className="text-center py-12 text-text-secondary border-2 border-dashed border-border rounded-lg">
                          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="mb-2">No documents available</p>
                          <p className="text-small">Upload documents in The Briefing Room to get started.</p>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => window.open('/briefing-room', '_blank')}
                          >
                            Go to Briefing Room
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Select All Option */}
                          <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-second-grey">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id="select-all"
                                checked={selectedDocuments.length === briefingDocuments.length && briefingDocuments.length > 0}
                                onCheckedChange={handleSelectAllDocuments}
                              />
                              <Label htmlFor="select-all" className="text-standard font-medium cursor-pointer">
                                Select All Documents ({briefingDocuments.length})
                              </Label>
                            </div>
                            <span className="text-small text-text-secondary">
                              {selectedDocuments.length} selected
                            </span>
                          </div>

                          {/* Document List */}
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {briefingDocuments.map((doc) => (
                              <div 
                                key={doc.id}
                                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedDocuments.includes(doc.id)
                                    ? 'border-shape-blue bg-shape-blue/5'
                                    : 'border-border bg-second-grey hover:bg-second-grey/80'
                                }`}
                                onClick={() => toggleDocumentSelection(doc.id)}
                              >
                                <Checkbox
                                  id={`doc-${doc.id}`}
                                  checked={selectedDocuments.includes(doc.id)}
                                  onCheckedChange={() => toggleDocumentSelection(doc.id)}
                                />
                                <div className="flex items-center gap-2">
                                  {doc.type === 'url' && <Globe className="w-4 h-4 text-shape-blue" />}
                                  {doc.type === 'file' && <FileText className="w-4 h-4 text-shape-blue" />}
                                  {doc.type === 'text' && <Type className="w-4 h-4 text-shape-blue" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Label htmlFor={`doc-${doc.id}`} className="text-standard font-medium cursor-pointer">
                                    {doc.name}
                                  </Label>
                                  <p className="text-small text-text-secondary">
                                    {doc.tag} • {doc.uploadedAt}
                                  </p>
                                </div>
                                <div className="text-small text-text-secondary">
                                  {doc.processed?.chunks?.length || 0} chunks
                                </div>
                              </div>
                            ))}
                          </div>

                          {selectedDocuments.length > 0 && (
                            <div className="p-3 bg-shape-blue/10 border border-shape-blue/20 rounded-lg">
                              <p className="text-small text-text-secondary">
                                <strong>{selectedDocuments.length}</strong> document{selectedDocuments.length === 1 ? '' : 's'} selected for this agent's knowledge base.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Advanced Settings */}
              <Card>
                <Collapsible open={openSections.advancedSettings} onOpenChange={() => toggleSection('advancedSettings')}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer bg-second-grey hover:bg-muted transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Settings className="w-5 h-5 text-text-primary" />
                          <CardTitle className="text-sub-header text-text-primary">Advanced Settings</CardTitle>
                        </div>
                        {openSections.advancedSettings ? 
                          <ChevronUp className="w-5 h-5 text-text-secondary" /> : 
                          <ChevronDown className="w-5 h-5 text-text-secondary" />
                        }
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="bg-background-secondary space-y-4 pt-6">
                      <div className="grid gap-4">
                        {Object.entries({
                          endCall: "End Call",
                          detectLanguage: "Detect Language",
                          skipTurn: "Skip Turn",
                          transferToAgent: "Transfer to Agent",
                          transferToNumber: "Transfer to Number",
                          playKeypadTone: "Play Keypad Tone",
                          voicemailDetection: "Voicemail Detection"
                        }).map(([key, label]) => (
                          <div key={key} className="flex items-center justify-between p-4 border rounded-lg bg-second-grey">
                            <Label htmlFor={key} className="text-standard font-medium cursor-pointer text-text-primary">
                              {label}
                            </Label>
                            <Switch
                              id={key}
                              checked={agentConfig.settings[key as keyof typeof agentConfig.settings]}
                              onCheckedChange={(checked) => updateSettings(key, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Footer */}
              <div className="bg-background-secondary border-t border-border pt-6">
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={handleBack} className="text-text-primary border-border hover:bg-background">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    <span className="text-standard">Back</span>
                  </Button>
                  <GradientButton 
                    onClick={handleCreate}
                    disabled={!isValid || isCreating}
                  >
                    <span>{isCreating ? "Creating..." : "Create Agent"}</span>
                  </GradientButton>
                </div>
              </div>


              </div>
            </main>
          ) : (
            <div className="flex-1 bg-background-secondary flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-sub-header text-text-primary mb-2">No Agent Selected</h3>
                <p className="text-standard text-text-secondary">Click "Build New Agent" to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewAgent;