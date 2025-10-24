import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";
import { audioService } from "@/lib/audioService";

interface UploadMusicDialogProps {
  trigger?: React.ReactNode;
}

export function UploadMusicDialog({ trigger }: UploadMusicDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);

    toast({
      title: "Upload started!",
      description: `Converting "${selectedFile.name}" to HD quality...`,
    });

    try {
      const result = await audioService.convertUploadedFile(selectedFile);
      
      toast({
        title: "HD Conversion Complete!",
        description: `"${selectedFile.name}" has been converted to HD quality and added to your library`,
      });

      console.log('HD conversion result:', result);
    } catch (error) {
      console.error('HD conversion failed:', error);
      toast({
        title: "Conversion Failed",
        description: "Failed to convert audio to HD quality. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
      setSelectedFile(null);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent data-testid="dialog-upload-music">
        <DialogHeader>
          <DialogTitle>Upload Music</DialogTitle>
          <DialogDescription>
            Upload your music files to your library
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="music-file">Select File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="music-file"
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                  }
                }}
                data-testid="input-music-file"
              />
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground" data-testid="text-selected-file">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFile(null);
                setOpen(false);
              }}
              data-testid="button-cancel-upload"
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isConverting} data-testid="button-confirm-upload">
              {isConverting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isConverting ? "Converting to HD..." : "Upload & Convert to HD"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
