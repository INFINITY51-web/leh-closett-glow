import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAdminSession, signOutAdmin, type AdminSession } from "../lib/admin-auth";
import { listAdminCategories, removeAdminCategory, saveAdminCategory, type AdminCategory } from "../lib/admin-categories";
import { listAdminProducts, removeAdminProductImage, uploadAdminProductImage, type AdminProduct } from "../lib/admin-products";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const session = await getAdminSession();
    if (!session && location.pathname !== "/admin/login") {
      throw redirect({ to: "/admin/login" });
    }
  },
  component: AdminRouteLayout,
});

function AdminRouteLayout() {
  const location = useLocation();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getAdminSession().then((currentSession) => {
      if (!active) return;
      setSession(currentSession);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (location.pathname === "/admin/login") return <Outlet />;

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Carregando painel...</main>;
  }

  if (!session) return null;

  return <AdminDashboard session={session} />;
}

function AdminDashboard({ session }: { session: AdminSession }) {
  const navigate = useNavigate();
  const [section, setSection] = useState("Visão geral");
  const [productArea, setProductArea] = useState<"Produtos" | "Categorias" | "Imagens">("Produtos");

  function handleSectionChange(nextSection: string) {
    setSection(nextSection);
    if (nextSection === "Produtos") setProductArea("Produtos");
  }

  async function handleSignOut() {
    await signOutAdmin();
    await navigate({ to: "/admin/login", replace: true });
  }

  const sections = ["Visão geral", "Site e Conteúdo", "Produtos", "Estoque", "Pedidos", "Logística", "Devoluções", "Financeiro", "Análises", "Clientes", "Configurações"];

  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 md:px-8">
        <Link to="/admin" className="text-sm font-semibold tracking-[0.16em]">LEH_CLOSETT <span className="text-primary">GLOW</span></Link>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="hidden sm:inline">{session.email}</span>
          <button type="button" onClick={handleSignOut} className="rounded-lg border border-border px-3 py-2 transition hover:border-primary hover:text-primary">Sair</button>
        </div>
      </div>
    </header>
    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 md:grid-cols-[14rem_1fr] md:px-8">
      <nav aria-label="Navegação administrativa" className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
        {sections.map((item) => <button key={item} type="button" onClick={() => handleSectionChange(item)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition ${section === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{item}</button>)}
      </nav>
      <main key={section} className="min-w-0">
        <p className="mb-3 text-xs uppercase tracking-[0.24em] text-primary">Painel administrativo</p>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{section}</h1>
        {section === "Visão geral" ? <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><article className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Acesso administrativo</p><p className="mt-3 text-lg font-medium">Painel ativo</p></article><article className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Conta conectada</p><p className="mt-3 truncate text-lg font-medium">{session.email}</p></article></div> : section === "Produtos" ? <ProductsArea area={productArea} onAreaChange={setProductArea} /> : <section className="mt-8 rounded-xl border border-border bg-card p-8"><p className="text-muted-foreground">Selecione uma função no menu para visualizar e gerenciar esta área.</p></section>}
      </main>
    </div>
  </div>;
}

function ProductsArea({ area, onAreaChange }: { area: "Produtos" | "Categorias" | "Imagens"; onAreaChange: (area: "Produtos" | "Categorias" | "Imagens") => void }) {
  return <div className="mt-8 space-y-6">
    <div className="flex gap-2 border-b border-border">
      {(["Produtos", "Categorias", "Imagens"] as const).map((item) => <button key={item} type="button" onClick={() => onAreaChange(item)} className={`border-b-2 px-3 py-2 text-sm transition ${area === item ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{item}</button>)}
    </div>
    {area === "Categorias" ? <CategoriesManager /> : area === "Imagens" ? <ProductImagesManager /> : <section className="rounded-xl border border-border bg-card p-8"><p className="text-muted-foreground">Gerencie os produtos cadastrados nesta área.</p></section>}
  </div>;
}

function ProductImagesManager() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productId, setProductId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function load() { try { setLoading(true); setProducts(await listAdminProducts()); } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível carregar as imagens."); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  const product = products.find((item) => item.id === productId);
  async function addImage(event: React.FormEvent) { event.preventDefault(); if (!product || !file) return; try { setSaving(true); setError(""); await uploadAdminProductImage(product.id, file, altText || product.name, product.product_images.length, product.product_images.length === 0); setFile(null); setAltText(""); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível adicionar a imagem."); } finally { setSaving(false); } }
  async function removeImage(image: AdminProduct["product_images"][number]) { if (!window.confirm("Remover esta imagem?")) return; try { await removeAdminProductImage(image.id, image.image_url); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível remover a imagem."); } }
  return <div className="space-y-6">
    <form onSubmit={addImage} className="grid gap-4 rounded-xl border border-border bg-card p-5 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
      <label className="text-sm">Produto<select aria-label="Produto da imagem" value={productId} onChange={(event) => setProductId(event.target.value)} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2"><option value="">Selecione</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="text-sm">Arquivo<input aria-label="Arquivo da imagem" type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mt-2 w-full text-sm" required /></label>
      <label className="text-sm">Texto alternativo<input aria-label="Texto alternativo" value={altText} onChange={(event) => setAltText(event.target.value)} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2" /></label>
      <button disabled={saving || loading || !product} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{saving ? "Enviando..." : "Adicionar"}</button>
    </form>
    {error && <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {!loading && products.length === 0 ? <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Nenhum produto cadastrado.</div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.flatMap((item) => item.product_images.map((image) => <article key={image.id} className="overflow-hidden rounded-xl border border-border bg-card"><img src={image.image_url} alt={image.alt_text || item.name} className="aspect-[4/5] w-full object-cover" /><div className="space-y-2 p-4"><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{image.is_primary ? "Imagem principal" : "Imagem adicional"}</p><button type="button" onClick={() => void removeImage(image)} className="text-sm text-destructive hover:underline">Remover</button></div></article>))}</div>}
  </div>;
}

function CategoriesManager() {
  const emptyForm = { name: "", description: "", active: true };
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try { setLoading(true); setError(""); setCategories(await listAdminCategories()); } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível carregar as categorias."); } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    try { setSaving(true); setError(""); await saveAdminCategory({ id: editingId, name: form.name.trim(), slug: (editingId ? categories.find((item) => item.id === editingId)?.slug : form.name).toLowerCase().trim().replace(/\\s+/g, "-"), description: form.description.trim() || null, image_url: null, active: form.active, sort_order: editingId ? categories.find((item) => item.id === editingId)?.sort_order ?? 0 : categories.length }); setForm(emptyForm); setEditingId(undefined); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível salvar a categoria."); } finally { setSaving(false); }
  }
  async function remove(id: string) { if (!window.confirm("Excluir esta categoria?")) return; try { await removeAdminCategory(id); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível excluir a categoria."); } }

  return <div className="space-y-6">
    <form onSubmit={submit} className="grid gap-4 rounded-xl border border-border bg-card p-5 md:grid-cols-[1fr_1.5fr_auto] md:items-end">
      <label className="text-sm">Nome<input aria-label="Nome da categoria" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2" required /></label>
      <label className="text-sm">Descrição<input aria-label="Descrição da categoria" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2" /></label>
      <div className="flex items-center gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />Ativa</label><button disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{saving ? "Salvando..." : editingId ? "Atualizar" : "Criar"}</button></div>
    </form>
    {error && <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    <div className="overflow-x-auto rounded-xl border border-border bg-card"><table className="w-full text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr><th className="p-4">Nome</th><th className="p-4">Descrição</th><th className="p-4">Status</th><th className="p-4">Ações</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Carregando categorias...</td></tr> : categories.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhuma categoria cadastrada.</td></tr> : categories.map((category) => <tr key={category.id} className="border-b border-border last:border-0"><td className="p-4 font-medium">{category.name}</td><td className="p-4 text-muted-foreground">{category.description || "—"}</td><td className="p-4">{category.active ? "Ativa" : "Inativa"}</td><td className="p-4"><button type="button" onClick={() => { setEditingId(category.id); setForm({ name: category.name, description: category.description || "", active: category.active }); }} className="mr-3 text-primary hover:underline">Editar</button><button type="button" onClick={() => void remove(category.id)} className="text-destructive hover:underline">Excluir</button></td></tr>)}</tbody></table></div>
  </div>;
}
