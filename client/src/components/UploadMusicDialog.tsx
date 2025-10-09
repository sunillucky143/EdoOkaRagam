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
import { Upload } from "lucide-react";

interface UploadMusicDialogProps {
  trigger?: React.ReactNode;
}

export function UploadMusicDialog({ trigger }: UploadMusicDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Upload started!",
      description: `Uploading "${selectedFile.name}"...`,
    });

    setTimeout(() => {
      toast({
        title: "Upload complete!",
        description: `"${selectedFile.name}" has been added to your library`,
      });
    }, 2000);

    setSelectedFile(null);
    setOpen(false);
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
            <Button onClick={handleUpload} data-testid="button-confirm-upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
