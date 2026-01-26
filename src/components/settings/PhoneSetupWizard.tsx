import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  PhoneForwarded, 
  RefreshCw, 
  Sparkles,
  Copy,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ConnectionMethod = "new_number" | "port_number" | "forward_calls";

interface PhoneSetupWizardProps {
  onComplete: (data: {
    connectionMethod: ConnectionMethod;
    originalBusinessNumber?: string;
    twilioPhoneNumber?: string;
  }) => void;
  onCancel: () => void;
  assignedPlatformNumber?: string;
}

const STEPS = [
  { id: 1, title: "Choose Method", description: "How to connect your number" },
  { id: 2, title: "Configuration", description: "Set up your connection" },
  { id: 3, title: "Verify", description: "Test your setup" },
];

export function PhoneSetupWizard({ 
  onComplete, 
  onCancel,
  assignedPlatformNumber = "+1 (555) 123-4567" 
}: PhoneSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>("new_number");
  const [originalBusinessNumber, setOriginalBusinessNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete({
        connectionMethod,
        originalBusinessNumber: connectionMethod !== "new_number" ? originalBusinessNumber : undefined,
        twilioPhoneNumber: connectionMethod === "new_number" ? assignedPlatformNumber : 
                          connectionMethod === "port_number" ? originalBusinessNumber : assignedPlatformNumber,
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(assignedPlatformNumber.replace(/\D/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulateVerification = () => {
    setVerificationStatus("testing");
    setTimeout(() => {
      setVerificationStatus("success");
    }, 2000);
  };

  const canProceed = () => {
    if (currentStep === 1) return true;
    if (currentStep === 2) {
      if (connectionMethod === "new_number") return true;
      return originalBusinessNumber.length >= 10;
    }
    if (currentStep === 3) {
      return verificationStatus === "success" || connectionMethod === "new_number";
    }
    return false;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          <CardTitle>Phone Agent Setup Wizard</CardTitle>
        </div>
        <CardDescription>
          Connect your phone number to enable AI-powered call answering.
        </CardDescription>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    currentStep > step.id 
                      ? "bg-primary text-primary-foreground" 
                      : currentStep === step.id 
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span className="text-xs mt-1 text-muted-foreground">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={cn(
                  "h-0.5 w-16 mx-2",
                  currentStep > step.id ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Step 1: Choose Connection Method */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium">How would you like to connect?</h3>
            <RadioGroup 
              value={connectionMethod} 
              onValueChange={(v) => setConnectionMethod(v as ConnectionMethod)}
              className="space-y-3"
            >
              <label 
                htmlFor="new_number"
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                  connectionMethod === "new_number" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                <RadioGroupItem value="new_number" id="new_number" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-medium">Get a New Number</span>
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    We'll assign you a dedicated phone number. Fastest setup - ready in minutes.
                  </p>
                </div>
              </label>

              <label 
                htmlFor="forward_calls"
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                  connectionMethod === "forward_calls" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                <RadioGroupItem value="forward_calls" id="forward_calls" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <PhoneForwarded className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">Forward Your Existing Number</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Keep your existing business number and forward calls to our AI. No carrier changes needed.
                  </p>
                </div>
              </label>

              <label 
                htmlFor="port_number"
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                  connectionMethod === "port_number" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                <RadioGroupItem value="port_number" id="port_number" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Port Your Existing Number</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Transfer your existing number to our system. Takes 1-3 business days.
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>
        )}

        {/* Step 2: Configuration */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {connectionMethod === "new_number" && (
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h4 className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Your Assigned Number
                  </h4>
                  <p className="text-2xl font-mono mt-2">{assignedPlatformNumber}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This number is ready to use. Customers can start calling immediately after setup.
                  </p>
                </div>
              </div>
            )}

            {connectionMethod === "forward_calls" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business_number">Your Current Business Number</Label>
                  <Input
                    id="business_number"
                    placeholder="+1 (555) 000-0000"
                    value={originalBusinessNumber}
                    onChange={(e) => setOriginalBusinessNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    The number your customers currently call.
                  </p>
                </div>

                <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <h4 className="font-medium flex items-center gap-2 text-amber-600">
                    <PhoneForwarded className="h-4 w-4" />
                    Forwarding Instructions
                  </h4>
                  <ol className="text-sm mt-3 space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="font-medium text-foreground">1.</span>
                      Contact your current phone carrier or access your phone system settings.
                    </li>
                    <li className="flex gap-2">
                      <span className="font-medium text-foreground">2.</span>
                      Set up call forwarding to this number:
                      <button 
                        onClick={copyToClipboard}
                        className="inline-flex items-center gap-1 font-mono bg-background px-2 py-0.5 rounded border"
                      >
                        {assignedPlatformNumber.replace(/\D/g, "")}
                        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-medium text-foreground">3.</span>
                      Choose "Forward all calls" or "Forward when busy/no answer".
                    </li>
                    <li className="flex gap-2">
                      <span className="font-medium text-foreground">4.</span>
                      Test by calling your business number from another phone.
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {connectionMethod === "port_number" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="port_number_input">Number to Port</Label>
                  <Input
                    id="port_number_input"
                    placeholder="+1 (555) 000-0000"
                    value={originalBusinessNumber}
                    onChange={(e) => setOriginalBusinessNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    The number you want to transfer to our system.
                  </p>
                </div>

                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <h4 className="font-medium flex items-center gap-2 text-blue-600">
                    <RefreshCw className="h-4 w-4" />
                    Porting Process
                  </h4>
                  <ol className="text-sm mt-3 space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="font-medium text-foreground">1.</span>
                      We'll submit a port request to your current carrier.
                    </li>
                    <li className="flex gap-2">
                      <span className="font-medium text-foreground">2.</span>
                      You'll receive a confirmation email within 24 hours.
                    </li>
                    <li className="flex gap-2">
                      <span className="font-medium text-foreground">3.</span>
                      The transfer typically completes in 1-3 business days.
                    </li>
                    <li className="flex gap-2">
                      <span className="font-medium text-foreground">4.</span>
                      During porting, your number remains active with your current carrier.
                    </li>
                  </ol>
                  <p className="text-xs mt-3 text-amber-600">
                    Note: Do not cancel service with your current carrier until the port is complete.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Verification */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {connectionMethod === "new_number" && (
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                <h3 className="font-medium text-lg mt-4">You're All Set!</h3>
                <p className="text-muted-foreground mt-2">
                  Your new phone number is ready. Click "Complete Setup" to start receiving calls.
                </p>
              </div>
            )}

            {connectionMethod === "forward_calls" && (
              <div className="space-y-4">
                <h3 className="font-medium">Test Your Forwarding Setup</h3>
                <p className="text-sm text-muted-foreground">
                  Call your business number ({originalBusinessNumber}) from another phone to verify forwarding is working.
                </p>
                
                <div className="p-4 rounded-lg border">
                  {verificationStatus === "idle" && (
                    <div className="text-center py-4">
                      <Phone className="h-12 w-12 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Click the button below after you've set up forwarding and made a test call.
                      </p>
                      <Button onClick={simulateVerification} className="mt-4">
                        I've Made a Test Call
                      </Button>
                    </div>
                  )}
                  
                  {verificationStatus === "testing" && (
                    <div className="text-center py-4">
                      <RefreshCw className="h-12 w-12 text-primary animate-spin mx-auto" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Checking for incoming calls...
                      </p>
                    </div>
                  )}
                  
                  {verificationStatus === "success" && (
                    <div className="text-center py-4">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                      <p className="text-sm text-green-600 font-medium mt-2">
                        Forwarding verified successfully!
                      </p>
                    </div>
                  )}
                  
                  {verificationStatus === "failed" && (
                    <div className="text-center py-4">
                      <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                      <p className="text-sm text-destructive mt-2">
                        We didn't detect any forwarded calls. Please check your forwarding settings.
                      </p>
                      <Button variant="outline" onClick={simulateVerification} className="mt-4">
                        Try Again
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {connectionMethod === "port_number" && (
              <div className="text-center py-8">
                <RefreshCw className="h-16 w-16 text-blue-500 mx-auto" />
                <h3 className="font-medium text-lg mt-4">Port Request Ready</h3>
                <p className="text-muted-foreground mt-2">
                  Click "Complete Setup" to submit your port request. We'll email you with updates.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  In the meantime, you can set up call forwarding so you don't miss any calls during the porting process.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={currentStep === 1 ? onCancel : handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 1 ? "Cancel" : "Back"}
          </Button>
          <Button 
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {currentStep === 3 ? "Complete Setup" : "Continue"}
            {currentStep < 3 && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
