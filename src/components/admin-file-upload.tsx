import { useEffect, useRef, useState } from "react";
import { describeSupabaseError, supabase } from "../lib/supabase";

type UploadKind = "image" | "video" | "all";

export type AdminFileUploadProps = {
  bucket?: string;
  folder?: string;
  kind?: UploadKind;
  onUploaded: (result: { path: string; url: string; file: File }) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
};

const imageExtensions = ["jpg", "jpeg", "png", "webp"];
const videoExtensions = ["mp4", "webm", "ogg"];
const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const videoTypes = ["video/mp4", "video/webm", "video/ogg"];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() || "";
}

export function AdminFileUpload({
  bucket = "product-images",
  folder = "admin",
  kind = "all",
  onUploaded,
  onError,
  disabled = false,
}: AdminFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function validate(nextFile: File) {
    const extension = extensionOf(nextFile.name);
    if (nextFile.size > 20 * 1024 * 1024) return "O arquivo deve ter no máximo 20 MB.";
    const isImage = imageExtensions.includes(extension) && imageTypes.includes(nextFile.type);
    const isVideo = videoExtensions.includes(extension) && videoTypes.includes(nextFile.type);
    const accepted = kind === "image" ? isImage : kind === "video" ? isVideo : isImage || isVideo;
    if (!nextFile.size) return "O arquivo está vazio e não pode ser enviado.";
    if (!accepted) return kind === "image"
      ? "Selecione uma imagem JPG, JPEG, PNG ou WEBP."
      : kind === "video"
        ? "Selecione um vídeo MP4, WEBM ou OGG compatível com o navegador."
        : "Selecione uma imagem JPG, JPEG, PNG, WEBP ou um vídeo MP4, WEBM ou OGG.";
    return "";
  }

  function selectFile(nextFile?: File) {
    if (!nextFile || disabled) return;
    const validationError = validate(nextFile);
    if (validationError) {
      setFile(null); setPreview(""); setStatus("error"); setMessage(validationError); onError?.(validationError); return;
    }
    setFile(nextFile); setStatus("idle"); setMessage("");
    setPreview(nextFile.type.startsWith("image/") ? URL.createObjectURL(nextFile) : "");
    if (nextFile.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        if (video.duration > 120) setMessage("O vídeo ultrapassa 2 minutos. Apenas os primeiros 2 minutos serão considerados na publicação.");
      };
      video.src = URL.createObjectURL(nextFile);
    }
  }

  async function uploadFile() {
    if (!file || !supabase) { setStatus("error"); setMessage("Não foi possível conectar ao armazenamento."); return; }
    setStatus("uploading"); setMessage("");
    const extension = extensionOf(file.name);
    const path = `${folder.replace(/^\/+|\/+$/g, "")}/${crypto.randomUUID()}.${extension}`;
    try {
      const result = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
      if (result.error) { const diagnostic = describeSupabaseError(result.error, "Falha no upload"); setStatus("error"); setMessage(diagnostic); onError?.(diagnostic); return; }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setStatus("success"); setMessage("Arquivo enviado com sucesso."); onUploaded({ path, url: data.publicUrl, file });
    } catch (error) {
      const diagnostic = describeSupabaseError(error, "Falha no upload");
      setStatus("error"); setMessage(diagnostic); onError?.(diagnostic);
    }
    return;
  }

  function removeFile() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(""); setStatus("idle"); setMessage("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return <div className="space-y-3 rounded-lg border border-border bg-card p-4">
    <input ref={inputRef} type="file" className="sr-only" accept={kind === "image" ? "image/jpeg,image/png,image/webp" : kind === "video" ? "video/mp4,video/webm,video/ogg" : "image/jpeg,image/png,image/webp,video/mp4,video/webm,video/ogg"} onChange={(event) => selectFile(event.target.files?.[0])} disabled={disabled || status === "uploading"} />
    <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0]); }} disabled={disabled || status === "uploading"} className={`flex min-h-28 w-full flex-col items-center justify-center rounded-md border border-dashed px-4 py-5 text-center transition-colors hover:border-primary hover:bg-muted/50 ${dragging ? "border-primary bg-muted" : "border-border"}`}>
      <span className="text-sm font-medium">+ Selecionar arquivo</span><span className="mt-1 text-xs text-muted-foreground">Até 20 MB · vídeos com no máximo 2 minutos</span>
    </button>
    {file && <div className="flex flex-col gap-4 rounded-md border border-border p-3 sm:flex-row sm:items-center">
      {preview ? <img src={preview} alt={`Prévia de ${file.name}`} className="h-20 w-28 rounded-md object-cover" /> : <div className="flex h-20 w-28 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">Vídeo</div>}
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{formatSize(file.size)}</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={removeFile} disabled={status === "uploading"} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50">Remover</button><button type="button" onClick={uploadFile} disabled={status === "uploading" || status === "success"} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50">{status === "uploading" ? "Enviando..." : "Enviar arquivo"}</button></div>
    </div>}
    {message && <p role="status" className={`text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>{message}</p>}
  </div>;
}
