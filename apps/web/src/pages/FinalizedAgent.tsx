import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Globe, MessageSquare, Settings, Phone } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface AgentData {
  id: string;
  type: "inbound" | "outbound";
  language: string;
  welcomeMessage: string;
  systemPrompt: string;
  settings: {
    endCall: boolean;
    detectLanguage: boolean;
    skipTurn: boolean;
    transferToAgent: boolean;
    transferToNumber: boolean;
    playKeypadTone: boolean;
    voicemailDetection: boolean;
  };
  createdAt: string;
}

const FinalizedAgent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [agentData, setAgentData] = useState<AgentData | null>(null);

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "it", name: "Italian", flag: "🇮🇹" },
    { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  ];

  useEffect(() => {
    // Get agent data from navigation state
    if (location.state?.agentData) {
      setAgentData(location.state.agentData);
      console.log("Agent data in memory:", location.state.agentData);
    } else {
      // If no data, redirect back to build page
      navigate("/build");
    }
  }, [location.state, navigate]);

  const handleSave = () => {
    if (agentData) {
      console.log("Saving updated agent data:", agentData);
      // TODO: Save to backend when ready
    }
  };

  const handleTestAgent = () => {
    console.log("Testing agent:", agentData);
    navigate("/test-agent", { state: { agentData } });
  };

  const updateAgentData = (updates: Partial<AgentData>) => {
    if (agentData) {
      setAgentData(prev => ({ ...prev!, ...updates }));
    }
  };

  const updateSettings = (settingKey: keyof AgentData['settings'], value: boolean) => {
    if (agentData) {
      setAgentData(prev => ({
        ...prev!,
        settings: {
          ...prev!.settings,
          [settingKey]: value
        }
      }));
    }
  };

  if (!agentData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/build")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-display font-bold text-foreground">
                {agentData.type === "inbound" ? "Inbound" : "Outbound"} Agent
              </h1>
              <p className="text-body text-muted-foreground">
                Configure and test your agent
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={handleSave}
              className="text-foreground border-border"
            >
              <Settings className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button 
              onClick={handleTestAgent}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Phone className="w-4 h-4 mr-2" />
              Test Agent
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Agent Type Info */}
          <Card className="p-6 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-h3 text-foreground">
                  {agentData.type === "inbound" ? "Inbound Agent" : "Outbound Agent"}
                </h3>
                <p className="text-body text-muted-foreground">
                  {agentData.type === "inbound" 
                    ? "Handles incoming calls from customers" 
                    : "Makes outgoing calls to prospects or customers"
                  }
                </p>
                <p className="text-caption text-muted-foreground mt-1">
                  Created: {new Date(agentData.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Agent Language */}
          <Card className="p-6 bg-card border border-border rounded-xl">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-h3 text-foreground">Agent Language</h3>
              </div>
              <div className="max-w-md">
                <Select 
                  value={agentData.language} 
                  onValueChange={(value) => updateAgentData({ language: value })}
                >
                  <SelectTrigger className="w-full bg-input">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border">
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* First Message */}
          <Card className="p-6 bg-card border border-border rounded-xl">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-h3 text-foreground">First message</h3>
              </div>
              <p className="text-body text-muted-foreground">
                The first message the agent will say. If empty, the agent will wait for the user to start the conversation.
              </p>
              <Input
                value={agentData.welcomeMessage}
                onChange={(e) => updateAgentData({ welcomeMessage: e.target.value })}
                placeholder="Hello! How can I help you today?"
                className="w-full bg-input"
              />
            </div>
          </Card>

          {/* System Prompt */}
          <Card className="p-6 bg-card border border-border rounded-xl">
            <div className="space-y-4">
              <h3 className="text-h3 text-foreground">System prompt</h3>
              <p className="text-body text-muted-foreground">
                The system prompt is used to determine the persona of the agent and the context of the conversation.
              </p>
              <Textarea
                value={agentData.systemPrompt}
                onChange={(e) => updateAgentData({ systemPrompt: e.target.value })}
                placeholder="Describe the desired agent (e.g., a customer support agent for ElevenLabs)"
                className="w-full min-h-32 bg-input"
              />
            </div>
          </Card>

          {/* Settings/Tools */}
          <Card className="p-6 bg-card border border-border rounded-xl">
            <div className="space-y-6">
              <div>
                <h3 className="text-h3 text-foreground">Settings</h3>
                <p className="text-body text-muted-foreground mt-1">
                  Let the agent perform specific actions.
                </p>
              </div>

              <div className="space-y-4">
                {/* End call */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <h4 className="text-body font-medium text-foreground">End call</h4>
                    <p className="text-body-sm text-muted-foreground">
                      Gives agent the ability to end the call with the user.
                    </p>
                  </div>
                  <Switch
                    checked={agentData.settings.endCall}
                    onCheckedChange={(checked) => updateSettings('endCall', checked)}
                  />
                </div>

                {/* Detect language */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <h4 className="text-body font-medium text-foreground">Detect language</h4>
                    <p className="text-body-sm text-muted-foreground">
                      Gives agent the ability to change the language during conversation.
                    </p>
                  </div>
                  <Switch
                    checked={agentData.settings.detectLanguage}
                    onCheckedChange={(checked) => updateSettings('detectLanguage', checked)}
                  />
                </div>

                {/* Skip turn */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <h4 className="text-body font-medium text-foreground">Skip turn</h4>
                    <p className="text-body-sm text-muted-foreground">
                      Agent will skip its turn if user explicitly indicates they need a moment.
                    </p>
                  </div>
                  <Switch
                    checked={agentData.settings.skipTurn}
                    onCheckedChange={(checked) => updateSettings('skipTurn', checked)}
                  />
                </div>

                {/* Transfer to agent */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <h4 className="text-body font-medium text-foreground">Transfer to agent</h4>
                    <p className="text-body-sm text-muted-foreground">
                      Gives agent the ability to transfer the call to another AI agent.
                    </p>
                  </div>
                  <Switch
                    checked={agentData.settings.transferToAgent}
                    onCheckedChange={(checked) => updateSettings('transferToAgent', checked)}
                  />
                </div>

                {/* Transfer to number */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <h4 className="text-body font-medium text-foreground">Transfer to number</h4>
                    <p className="text-body-sm text-muted-foreground">
                      Gives agent the ability to transfer the call to a human.
                    </p>
                  </div>
                  <Switch
                    checked={agentData.settings.transferToNumber}
                    onCheckedChange={(checked) => updateSettings('transferToNumber', checked)}
                  />
                </div>

                {/* Play keypad touch tone */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <h4 className="text-body font-medium text-foreground">Play keypad touch tone</h4>
                    <p className="text-body-sm text-muted-foreground">
                      Gives agent the ability to play keypad touch tones during a phone call.
                    </p>
                  </div>
                  <Switch
                    checked={agentData.settings.playKeypadTone}
                    onCheckedChange={(checked) => updateSettings('playKeypadTone', checked)}
                  />
                </div>

                {/* Voicemail detection */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <h4 className="text-body font-medium text-foreground">Voicemail detection</h4>
                    <p className="text-body-sm text-muted-foreground">
                      Allows agent to detect voicemail systems and optionally leave a message.
                    </p>
                  </div>
                  <Switch
                    checked={agentData.settings.voicemailDetection}
                    onCheckedChange={(checked) => updateSettings('voicemailDetection', checked)}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FinalizedAgent;