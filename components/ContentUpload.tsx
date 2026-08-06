"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";

interface ContentUploadProps {
  userId: string;
  onUploadSuccess?: (content: any) => void;
}

export function ContentUpload({ userId, onUploadSuccess }: ContentUploadProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"study_set" | "notes" | "reference">("study_set");
  const [jsonData, setJsonData] = useState("");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jsonError, setJsonError] = useState("");

  const validateJson = (jsonString: string) => {
    try {
      JSON.parse(jsonString);
      setJsonError("");
      return true;
    } catch (e) {
      setJsonError("Invalid JSON format");
      return false;
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonData(value);
    if (value.trim()) {
      validateJson(value);
    } else {
      setJsonError("");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setJsonData(content);
        validateJson(content);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!jsonData.trim()) {
      setError("Content data is required");
      return;
    }

    if (!validateJson(jsonData)) {
      setError("Invalid JSON format");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const parsedData = JSON.parse(jsonData);
      const tagsArray = tags.split(",").map((tag) => tag.trim()).filter(Boolean);

      const response = await fetch("/api/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          type,
          data: parsedData,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
          isPublic,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload content");
      }

      // Reset form
      setTitle("");
      setDescription("");
      setJsonData("");
      setTags("");
      setIsPublic(false);

      if (onUploadSuccess) {
        onUploadSuccess(result.content);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload content");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Content Upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter content title"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Enter content description (optional)"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Content Type *</Label>
            <Select value={type} onValueChange={(value: any) => setType(value)} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="study_set">Study Set</SelectItem>
                <SelectItem value="notes">Notes</SelectItem>
                <SelectItem value="reference">Reference</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="json">JSON Data *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("file-upload")?.click()}
                disabled={loading}
              >
                <FileText className="w-4 h-4 mr-2" />
                Upload JSON File
              </Button>
              <input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <Textarea
              id="json"
              value={jsonData}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleJsonChange(e.target.value)}
              placeholder="Paste or upload JSON content"
              rows={10}
              className="font-mono text-sm"
              disabled={loading}
            />
            {jsonError && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {jsonError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="math, science, history"
              disabled={loading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="public"
              checked={isPublic}
              onCheckedChange={(checked: boolean) => setIsPublic(checked)}
              disabled={loading}
            />
            <Label htmlFor="public" className="cursor-pointer">
              Make this content public
            </Label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Content
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
