import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, PhoneIncoming, PhoneOutgoing, Globe, MessageSquare, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NewAgent = () => {
  const navigate = useNavigate();
  
  // Unified state for entire agent configuration
  const [agentConfig, setAgentConfig] = useState({
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

  // State for collapsible sections
  const [openSections, setOpenSections] = useState({
    agentType: true,
    agentInstructions: true,
    modelInstructions: true,
    advancedSettings: true,
  });

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "zh", name: "Chinese", flag: "🇨🇳" },
    { code: "hr", name: "Croatian", flag: "🇭🇷" },
    { code: "cs", name: "Czech", flag: "🇨🇿" },
    { code: "da", name: "Danish", flag: "🇩🇰" },
    { code: "nl", name: "Dutch", flag: "🇳🇱" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "it", name: "Italian", flag: "🇮🇹" },
    { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  ];

  // Auto-save functionality
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (agentConfig.type) {
        localStorage.setItem('draft_agent', JSON.stringify(agentConfig));
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [agentConfig]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('draft_agent');
    if (draft) {
      try {
        setAgentConfig(JSON.parse(draft));
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  const updateConfig = (updates: Partial<typeof agentConfig>) => {
    setAgentConfig(prev => ({ ...prev, ...updates }));
  };

  const updateSettings = (key: string, value: boolean) => {
    setAgentConfig(prev => ({
      ...prev,
      settings: { ...prev.settings, [key]: value }
    }));
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleBack = () => {
    navigate("/build");
  };

  const handleCreate = async () => {
    if (!agentConfig.type) return;

    setIsCreating(true);
    setApiError(null);

    // Prepare agent configuration for backend API
    const agentPayload = {
      name: `${agentConfig.type?.charAt(0).toUpperCase()}${agentConfig.type?.slice(1)} Agent`,
      type: agentConfig.type,
      language: agentConfig.language,
      welcomeMessage: agentConfig.welcomeMessage,
      systemPrompt: agentConfig.systemPrompt,
      settings: agentConfig.settings,
      createdBy: "user@example.com", // TODO: Replace with actual user authentication
    };

    try {
      // TODO: Replace with actual backend API URL
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      
      /**
       * API Call to Backend: POST /agents
       * 
       * Expected Request Body:
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
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (!data.success) {
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

  const isValid = agentConfig.type !== null;

  return (
    <div className="min-h-screen bg-background">
      {/* API Error Display */}
      {apiError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md mb-4 mx-8 mt-4">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">Error creating agent:</div>
          </div>
          <div className="text-sm mt-1">{apiError}</div>
          <button 
            onClick={() => setApiError(null)}
            className="text-xs underline mt-2 hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Configuration</h1>
                <p className="text-sm text-muted-foreground">Create and configure your AI agent</p>
              </div>
            </div>
            <Button 
              onClick={handleCreate}
              disabled={!isValid || isCreating}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isCreating ? "Creating..." : "Create Agent"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">
        
        {/* 1. Agent Type Section */}
        <Card className="border-0 shadow-sm">
          <Collapsible open={openSections.agentType} onOpenChange={() => toggleSection('agentType')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="bg-muted/30 hover:bg-muted/40 cursor-pointer transition-colors border border-border rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PhoneIncoming className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg font-medium">Agent Type</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Choose the type of agent you want to create</p>
                    </div>
                  </div>
                  {openSections.agentType ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="p-6 border-x border-b border-border rounded-b-lg">
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  {/* Inbound Card */}
                  <div 
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      agentConfig.type === "inbound" 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => updateConfig({ type: "inbound" })}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        agentConfig.type === "inbound" 
                          ? "bg-primary border-primary" 
                          : "border-border"
                      }`}>
                        {agentConfig.type === "inbound" && (
                          <div className="w-full h-full rounded-full bg-background scale-50"></div>
                        )}
                      </div>
                      <PhoneIncoming className="w-6 h-6 text-muted-foreground" />
                      <span className="font-medium">Inbound</span>
                    </div>
                  </div>

                  {/* Outbound Card */}
                  <div 
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      agentConfig.type === "outbound" 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => updateConfig({ type: "outbound" })}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        agentConfig.type === "outbound" 
                          ? "bg-primary border-primary" 
                          : "border-border"
                      }`}>
                        {agentConfig.type === "outbound" && (
                          <div className="w-full h-full rounded-full bg-background scale-50"></div>
                        )}
                      </div>
                      <PhoneOutgoing className="w-6 h-6 text-muted-foreground" />
                      <span className="font-medium">Outbound</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* 2. Agent Instructions Section */}
        <Card className="border-0 shadow-sm">
          <Collapsible open={openSections.agentInstructions} onOpenChange={() => toggleSection('agentInstructions')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="bg-muted/30 hover:bg-muted/40 cursor-pointer transition-colors border border-border rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg font-medium">Agent Instructions</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Define how your agent communicates</p>
                    </div>
                  </div>
                  {openSections.agentInstructions ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="p-6 border-x border-b border-border rounded-b-lg space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage" className="text-sm font-medium">Welcome Message</Label>
                  <Textarea
                    id="welcomeMessage"
                    placeholder="Enter the initial greeting your agent will use..."
                    value={agentConfig.welcomeMessage}
                    onChange={(e) => updateConfig({ welcomeMessage: e.target.value })}
                    className="min-h-[80px] resize-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="systemPrompt" className="text-sm font-medium">System Prompt</Label>
                  <Textarea
                    id="systemPrompt"
                    placeholder="Provide detailed instructions for your agent's behavior..."
                    value={agentConfig.systemPrompt}
                    onChange={(e) => updateConfig({ systemPrompt: e.target.value })}
                    className="min-h-[120px] resize-none"
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* 3. Model Instructions Section */}
        <Card className="border-0 shadow-sm">
          <Collapsible open={openSections.modelInstructions} onOpenChange={() => toggleSection('modelInstructions')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="bg-muted/30 hover:bg-muted/40 cursor-pointer transition-colors border border-border rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg font-medium">Model Instructions</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Configure language and model settings</p>
                    </div>
                  </div>
                  {openSections.modelInstructions ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="p-6 border-x border-b border-border rounded-b-lg">
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-sm font-medium">Language</Label>
                  <Select value={agentConfig.language} onValueChange={(value) => updateConfig({ language: value })}>
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-xs bg-muted">
                              {lang.flag}
                            </div>
                            <span>{lang.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* 4. Advanced Settings Section */}
        <Card className="border-0 shadow-sm">
          <Collapsible open={openSections.advancedSettings} onOpenChange={() => toggleSection('advancedSettings')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="bg-muted/30 hover:bg-muted/40 cursor-pointer transition-colors border border-border rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg font-medium">Advanced Settings</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Configure advanced agent capabilities</p>
                    </div>
                  </div>
                  {openSections.advancedSettings ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="p-6 border-x border-b border-border rounded-b-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries({
                    endCall: "End Call",
                    detectLanguage: "Detect Language",
                    skipTurn: "Skip Turn",
                    transferToAgent: "Transfer to Agent",
                    transferToNumber: "Transfer to Number",
                    playKeypadTone: "Play Keypad Tone",
                    voicemailDetection: "Voicemail Detection"
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                      <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
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
      </div>

      {/* Footer */}
      <div className="border-t bg-card mt-8">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!isValid || isCreating}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isCreating ? "Creating..." : "Create Agent"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAgent;