import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: string;
}

export function ContactFormDialog({ open, onOpenChange, source }: ContactFormDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: { name: string; email: string; message: string; source?: string }) => {
      const res = await apiRequest("POST", "/api/contact", data);
      return res.json();
    },
    onSuccess: () => {
      setSent(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    mutation.mutate({ name: name.trim(), email: email.trim(), message: message.trim(), source });
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setTimeout(() => {
        setName("");
        setEmail("");
        setMessage("");
        setSent(false);
        mutation.reset();
      }, 200);
    }
    onOpenChange(isOpen);
  };

  if (sent) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-contact-success">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <DialogTitle>Message sent</DialogTitle>
            <DialogDescription>
              Thanks for reaching out! We'll get back to you at {email}.
            </DialogDescription>
            <Button variant="outline" onClick={() => handleClose(false)} data-testid="button-contact-done">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-contact-form">
        <DialogHeader>
          <DialogTitle>Get in touch</DialogTitle>
          <DialogDescription>
            Send us a message and we'll get back to you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-name">Name</Label>
            <Input
              id="contact-name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              data-testid="input-contact-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="input-contact-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              placeholder="How can we help?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              data-testid="input-contact-message"
            />
          </div>

          {mutation.isError && (
            <div className="flex items-center gap-2 text-sm text-destructive" data-testid="text-contact-error">
              <AlertCircle className="h-4 w-4" />
              Something went wrong. Please try again.
            </div>
          )}

          <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-contact-submit">
            {mutation.isPending ? (
              "Sending..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send message
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
