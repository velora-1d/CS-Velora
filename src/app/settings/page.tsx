"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Store,
  Bot,
  Cpu,
  CreditCard,
  User,
  Lock,
  Shield,
  Globe,
  Save,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Building,
  QrCode,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Copy,
  Check,
  Clock,
  MessageSquare,
  Timer,
  Webhook,
  AlertTriangle,
  ShieldAlert,
  Key,
  ChevronDown,
  X,
  Smartphone,
  Wifi,
  RefreshCw,
  WifiOff,
  Upload,
  ExternalLink,
  Activity,
  Link2,
  BookOpen,
} from "lucide-react";

import { ConfirmModal } from "@/components/ui/confirm-modal";
import { CustomDropdown } from "@/components/ui/custom-dropdown";
import { useSession } from "next-auth/react";

// --- Types ---
type ProfileData = {
  namaToko: string;
  deskripsi: string;
  logoUrl: string;
  linkShopee: string;
  linkTiktok: string;
  waNumber: string;
  waProvider: string;
  waApiKey: string;
  paket: string;
  pakasirProjectSlug: string;
  pakasirApiKey: string;
  tenantTypeId: string;
  catalogLabel: string;
  orderLabel: string;
  pakasirWebhookUrl?: string;
};

type BotSettingsData = {
  greeting: string;
  pesanOffline: string;
  jamBuka: string;
  jamTutup: string;
  delayMin: number;
  delayMax: number;
  typingIndicator: boolean;
  aiEnabled: boolean;
  bahasaDefault: string;
};

type PaymentItem = {
  id: string;
  tipe: "transfer" | "qris";
  namaBank: string | null;
  nomorRekening: string | null;
  namaPemilik: string | null;
  gambarQris: string | null;
  urutan: number;
  aktif: boolean;
};

type PaymentForm = {
  tipe: "transfer" | "qris";
  namaBank: string;
  nomorRekening: string;
  namaPemilik: string;
  gambarQris: string;
  urutan: string;
};

type AccountData = {
  nama: string;
  email: string;
  bahasa: string;
};

type TenantType = {
  id: string;
  name: string;
  catalogLabel: string;
  orderLabel: string;
  fieldTemplate?: Array<{ label: string; fieldType: string; isSystem?: boolean; isRequired?: boolean }>;
};

type WaSession = {
  id: string;
  sessionId: string;
  waNumber: string;
  label: string;
  status: string;
  businessProfileId?: string | null;
  createdAt: string;
};

type BusinessProfile = {
  id: string;
  tenantId: string;
  tenantTypeId?: string | null;
  name: string;
  greeting: string;
  pesanOffline: string;
  aiEnabled: boolean;
  systemPrompt: string;
  model: string;
  createdAt?: string;
};

// --- Defaults ---
const profileDefaults: ProfileData = {
  namaToko: "",
  deskripsi: "",
  logoUrl: "",
  linkShopee: "",
  linkTiktok: "",
  waNumber: "",
  waProvider: "",
  waApiKey: "",
  paket: "",
  pakasirProjectSlug: "",
  pakasirApiKey: "",
  tenantTypeId: "",
  catalogLabel: "Produk",
  orderLabel: "Pesanan",
  pakasirWebhookUrl: "",
};

const botDefaults: BotSettingsData = {
  greeting: "Halo! Ada yang bisa kami bantu?",
  pesanOffline: "Maaf, kami sedang offline.",
  jamBuka: "08:00",
  jamTutup: "17:00",
  delayMin: 2000,
  delayMax: 5000,
  typingIndicator: true,
  aiEnabled: true,
  bahasaDefault: "id",
};

const paymentFormDefaults: PaymentForm = {
  tipe: "transfer",
  namaBank: "",
  nomorRekening: "",
  namaPemilik: "",
  gambarQris: "",
  urutan: "0",
};

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { text: string; cls: string; icon: React.ReactNode }> = {
    connected: {
      text: "Terhubung",
      cls: "bg-[#4ADE80]/10 text-[#4ADE80]",
      icon: <Wifi className="h-3 w-3" />,
    },
    disconnected: {
      text: "Terputus",
      cls: "bg-[#EF4444]/10 text-[#EF4444]",
      icon: <WifiOff className="h-3 w-3" />,
    },
    qr_pending: {
      text: "Menunggu Scan QR",
      cls: "bg-[#FFBF69]/10 text-[#FFBF69]",
      icon: <QrCode className="h-3 w-3" />,
    },
  };

  const meta = config[status] || {
    text: status,
    cls: "bg-[#94A3B8]/10 text-[#94A3B8]",
    icon: <Clock className="h-3 w-3" />,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.cls}`}>
      {meta.icon}
      {meta.text}
    </span>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);

  // States: Tab 1 - Profile
  const [profile, setProfile] = useState<ProfileData>(profileDefaults);
  const [tenantTypes, setTenantTypes] = useState<TenantType[]>([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // States: Tab 2 - Bot Settings & WhatsApp Sessions
  const [botSettings, setBotSettings] = useState<BotSettingsData>(botDefaults);
  const [isSavingBot, setIsSavingBot] = useState(false);
  const [testingWaConn, setTestingWaConn] = useState(false);
  const [waSessions, setWaSessions] = useState<WaSession[]>([]);
  
  // States: Tab - Business Profiles
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [isSavingProfileItem, setIsSavingProfileItem] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<BusinessProfile | null>(null);
  
  const defaultProfileForm = {
    name: "",
    tenantTypeId: "",
    greeting: "Halo! Selamat datang di layanan kami. Ada yang bisa kami bantu?",
    pesanOffline: "Maaf, saat ini kami sedang offline. Pesan Anda akan dibalas setelah kami online kembali.",
    aiEnabled: true,
    systemPrompt: "Anda adalah asisten virtual yang ramah.",
    model: "qwen-vl-plus",
  };
  const [profileForm, setProfileForm] = useState<Partial<BusinessProfile>>(defaultProfileForm);
  const [loadingWaSessions, setLoadingWaSessions] = useState(true);
  const [addingWaSession, setAddingWaSession] = useState(false);
  const [waSessionError, setWaSessionError] = useState<string | null>(null);
  const [showAddWaModal, setShowAddWaModal] = useState(false);
  const [waLabelInput, setWaLabelInput] = useState("");
  const [waQrModal, setWaQrModal] = useState<{ sessionId: string; qrUrl: string } | null>(null);

  // Logo uploading states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingQris, setUploadingQris] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File terlalu besar (Maksimal 2MB)");
      return;
    }

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setProfile((prev) => ({ ...prev, logoUrl: data.url }));
        toast.success("Logo berhasil diunggah!");
      } else {
        toast.error(data.error || "Gagal mengunggah logo");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengunggah");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File terlalu besar (Maksimal 5MB)");
      return;
    }

    try {
      setUploadingQris(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "qris");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setPaymentFormData((prev) => ({ ...prev, gambarQris: data.url }));
        toast.success("Gambar QRIS berhasil diunggah!");
      } else {
        toast.error(data.error || "Gagal mengunggah gambar QRIS");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengunggah QRIS");
    } finally {
      setUploadingQris(false);
    }
  };

  // --- Confirm Modal State ---
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({
    isOpen: false,
    message: "",
    onConfirm: () => {},
  });

  const showConfirm = (options: {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }) => {
    setConfirmConfig({
      isOpen: true,
      ...options,
    });
  };

  const closeConfirm = () => {
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
  };
  const [waLimitReached, setWaLimitReached] = useState(false);

  // States: Tab 3 - AI Settings
  const [systemPrompt, setSystemPrompt] = useState("");
  const [namaAgent, setNamaAgent] = useState("");
  const [model, setModel] = useState("");
  const [tone, setTone] = useState("semi-formal");
  const [aktif, setAktif] = useState(true);
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [dynamicModels, setDynamicModels] = useState<{ id: string; name?: string; object?: string }[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [searchModel, setSearchModel] = useState("");
  const [isSavingAi, setIsSavingAi] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // States: Tab 4 - Payments (Manual List & Drawer)
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentItem | null>(null);
  const [paymentFormData, setPaymentFormData] = useState<PaymentForm>(paymentFormDefaults);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // States: Tab 5 - Account & Security Policies
  const [account, setAccount] = useState<AccountData>({ nama: "", email: "", bahasa: "id" });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingLang, setIsSavingLang] = useState(false);

  const [rateLimitPerMinute, setRateLimitPerMinute] = useState("30");
  const [dataRetentionDays, setDataRetentionDays] = useState("90");
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [testingPakasir, setTestingPakasir] = useState(false);
  const [testingS3, setTestingS3] = useState(false);
  const [waTestRecipient, setWaTestRecipient] = useState("");
  const [showWaTestModal, setShowWaTestModal] = useState(false);


  useEffect(() => {
    fetchAllData();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && ["profile", "businesses", "bot", "ai", "payment", "security"].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, []);

  // Fetch models dynamically when model picker modal opens
  useEffect(() => {
    if (isModelModalOpen) {
      fetchModels();
    }
  }, [isModelModalOpen, provider, apiKey, baseUrl]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfile(),
        fetchBotSettings(),
        fetchAiSettings(),
        fetchPayments(),
        fetchAccount(),
        fetchTenantTypes(),
        fetchWaSessions(),
        fetchBusinessProfiles(),
      ]);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Gagal memuat beberapa konfigurasi.");
    } finally {
      setLoading(false);
    }
  };

  // --- Fetchers ---
  const fetchProfile = async () => {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const data = await res.json();
      setProfile({ ...profileDefaults, ...data });
    }
  };

  const fetchBusinessProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const res = await fetch("/api/business-profiles");
      if (res.ok) {
        const data = await res.json();
        setBusinessProfiles(data);
      }
    } catch (error) {
      console.error("Error loading business profiles:", error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const fetchWaSessions = async () => {
    try {
      setLoadingWaSessions(true);
      const res = await fetch("/api/whatsapp/sessions");
      const data = await res.json();
      if (res.ok) {
        setWaSessions(data);
      }
    } catch {
      setWaSessionError("Gagal memuat sesi WhatsApp.");
    } finally {
      setLoadingWaSessions(false);
    }
  };

  const handleSaveBusinessProfile = async () => {
    if (!profileForm.name?.trim()) {
      toast.error("Nama bisnis wajib diisi.");
      return;
    }

    try {
      setIsSavingProfileItem(true);
      const isEdit = !!editingProfile;
      const url = isEdit ? `/api/business-profiles/${editingProfile.id}` : "/api/business-profiles";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(isEdit ? "Profil bisnis diperbarui!" : "Profil bisnis baru dibuat!");
        setShowProfileModal(false);
        setEditingProfile(null);
        setProfileForm(defaultProfileForm);
        fetchBusinessProfiles();
      } else {
        toast.error(data.error || "Gagal menyimpan profil bisnis.");
      }
    } catch (error) {
      console.error("Error saving business profile:", error);
      toast.error("Gagal menyimpan profil bisnis.");
    } finally {
      setIsSavingProfileItem(false);
    }
  };

  const handleDeleteBusinessProfile = async (id: string) => {
    try {
      const res = await fetch(`/api/business-profiles/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Profil bisnis berhasil dihapus.");
        fetchBusinessProfiles();
        fetchWaSessions(); // Reload sessions to clear deleted profile links
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menghapus profil bisnis.");
      }
    } catch (error) {
      console.error("Error deleting business profile:", error);
      toast.error("Gagal menghapus profil bisnis.");
    }
  };

  const handleLinkWaSession = async (sessionId: string, businessProfileId: string) => {
    try {
      const res = await fetch(`/api/whatsapp/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessProfileId: businessProfileId || null }),
      });
      if (res.ok) {
        toast.success("Sesi WhatsApp berhasil ditautkan ke profil bisnis!");
        fetchWaSessions();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menautkan sesi WhatsApp.");
      }
    } catch (error) {
      console.error("Error linking WA session:", error);
      toast.error("Gagal menautkan sesi WhatsApp.");
    }
  };

  const handleTestWaConnection = async (selectedProvider: "waha" | "fonnte") => {
    setTestingWaConn(true);
    const toastId = toast.loading(`Menguji koneksi ${selectedProvider.toUpperCase()}...`);
    try {
      const res = await fetch("/api/whatsapp/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.success) {
          toast.success(data.message, { id: toastId, description: data.details, duration: 5000 });
        } else {
          toast.error(data.message, { id: toastId, duration: 6000 });
        }
      } else {
        toast.error(data.error || "Gagal menguji koneksi", { id: toastId });
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi", { id: toastId });
    } finally {
      setTestingWaConn(false);
    }
  };

  const handleAddWaSession = async () => {
    if (!waLabelInput.trim()) {
      setWaSessionError("Nama Sesi / Label wajib diisi.");
      return;
    }
    try {
      setAddingWaSession(true);
      setWaSessionError(null);
      const res = await fetch("/api/whatsapp/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: waLabelInput }),
      });
      const data = await res.json();

      if (!res.ok) {
        setWaSessionError(data.error || "Gagal menambah sesi.");
        if (data.limitReached) setWaLimitReached(true);
        return;
      }

      setShowAddWaModal(false);
      setWaLabelInput("");
      setWaQrModal({ sessionId: data.session.id, qrUrl: data.qrUrl });
      await fetchWaSessions();
    } catch {
      setWaSessionError("Gagal menghubungi server.");
    } finally {
      setAddingWaSession(false);
    }
  };

  const handleDeleteWaSession = async (id: string) => {
    showConfirm({
      title: "Hapus Sesi WhatsApp",
      message: "Yakin ingin menghapus sesi WA ini?",
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
      isDanger: true,
      onConfirm: async () => {
        const res = await fetch(`/api/whatsapp/sessions/${id}`, { method: "DELETE" });
        if (res.ok) {
          setWaSessions((prev) => prev.filter((s) => s.id !== id));
          toast.success("Sesi WhatsApp berhasil dihapus!");
        } else {
          toast.error("Gagal menghapus sesi WhatsApp.");
        }
      }
    });
  };

  const fetchTenantTypes = async () => {
    const res = await fetch("/api/tenant-types");
    if (res.ok) {
      const data = await res.json();
      setTenantTypes(data);
    }
  };

  const fetchBotSettings = async () => {
    const res = await fetch("/api/bot-settings");
    if (res.ok) {
      const data = await res.json();
      setBotSettings({
        ...botDefaults,
        ...data,
        jamBuka: data.jamBuka?.substring(0, 5) || botDefaults.jamBuka,
        jamTutup: data.jamTutup?.substring(0, 5) || botDefaults.jamTutup,
      });
    }
  };

  const fetchAiSettings = async () => {
    const res = await fetch("/api/ai-settings");
    if (res.ok) {
      const data = await res.json();
      setSystemPrompt(data.systemPrompt || "");
      setNamaAgent(data.namaAgent || "");
      setModel(data.model || "");
      setTone(data.tone || "semi-formal");
      setAktif(data.aktif ?? true);
      setProvider(data.provider || "openai");
      setApiKey(data.apiKey || "");
      setBaseUrl(data.baseUrl || "");
    }
  };

  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      const res = await fetch("/api/ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey, baseUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setDynamicModels(data.data || []);
      } else {
        setDynamicModels([]);
      }
    } catch (error) {
      console.error(error);
      setDynamicModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const fetchPayments = async () => {
    const res = await fetch("/api/bank-accounts");
    if (res.ok) {
      const data = await res.json();
      setPayments(data);
    }
  };

  const fetchAccount = async () => {
    const res = await fetch("/api/account");
    if (res.ok) {
      const data = await res.json();
      setAccount(data);
    }
  };

  // --- Handlers ---
  const handleSaveProfile = async () => {
    if (!profile.namaToko.trim()) {
      toast.error("Nama toko wajib diisi.");
      return;
    }
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        toast.success("Profil berhasil diperbarui!");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("profile-updated"));
        }
      } else {
        toast.error("Gagal menyimpan profil.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleTenantTypeChange = (newTypeId: string) => {
    const selectedType = tenantTypes.find((t) => t.id === newTypeId);
    if (!selectedType) return;

    const applyChange = () => {
      setProfile((c) => ({
        ...c,
        tenantTypeId: newTypeId,
        catalogLabel: selectedType.catalogLabel,
        orderLabel: selectedType.orderLabel,
      }));
    };

    if (profile.tenantTypeId && profile.tenantTypeId !== newTypeId) {
      showConfirm({
        title: "Ubah Tipe Bisnis / Template",
        message: "PERINGATAN: Mengubah tipe bisnis akan mereset field katalog kustom Anda dan menggantinya dengan template bawaan dari tipe bisnis baru. Apakah Anda yakin?",
        confirmLabel: "Ya, Ubah",
        cancelLabel: "Batal",
        isDanger: true,
        onConfirm: applyChange,
      });
    } else {
      applyChange();
    }
  };

  const handleSaveBot = async () => {
    if (botSettings.delayMin < 1000) {
      toast.error("Delay minimum harus minimal 1000ms (1 detik).");
      return;
    }
    if (botSettings.delayMax < botSettings.delayMin) {
      toast.error("Delay maximum harus lebih besar dari delay minimum.");
      return;
    }
    setIsSavingBot(true);
    try {
      const payload = {
        ...botSettings,
        jamBuka: botSettings.jamBuka.length === 5 ? botSettings.jamBuka + ":00" : botSettings.jamBuka,
        jamTutup: botSettings.jamTutup.length === 5 ? botSettings.jamTutup + ":00" : botSettings.jamTutup,
      };
      const res = await fetch("/api/bot-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Pengaturan bot berhasil disimpan!");
      } else {
        toast.error("Gagal menyimpan pengaturan.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsSavingBot(false);
    }
  };

  const handleSaveAi = async () => {
    setIsSavingAi(true);
    try {
      const res = await fetch("/api/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          namaAgent,
          model,
          tone,
          aktif,
          provider,
          apiKey,
          baseUrl,
        }),
      });

      if (res.ok) {
        toast.success("Kredensial & Pengaturan AI disimpan!");
        fetchModels();
      } else {
        toast.error("Gagal menyimpan pengaturan AI.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsSavingAi(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await fetch("/api/ai/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey,
          baseUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Koneksi berhasil terhubung!");
      } else {
        toast.error(data.error || "Koneksi gagal.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTestPakasir = async () => {
    setTestingPakasir(true);
    const toastId = toast.loading("Menguji koneksi Pakasir...");
    try {
      const res = await fetch("/api/pakasir/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectSlug: profile.pakasirProjectSlug,
          apiKey: profile.pakasirApiKey,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Koneksi Pakasir sukses!", { id: toastId });
      } else {
        toast.error(data.error || "Koneksi Pakasir gagal.", { id: toastId });
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.", { id: toastId });
    } finally {
      setTestingPakasir(false);
    }
  };

  const handleTestS3 = async () => {
    setTestingS3(true);
    const toastId = toast.loading("Menguji koneksi S3 Storage...");
    try {
      const res = await fetch("/api/storage/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Koneksi S3 Storage sukses!", { id: toastId });
      } else {
        toast.error(data.error || "Koneksi S3 Storage gagal.", { id: toastId });
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.", { id: toastId });
    } finally {
      setTestingS3(false);
    }
  };

  const handleTestWaWithMessage = async () => {
    if (!waTestRecipient.trim()) {
      toast.error("Nomor WhatsApp penerima wajib diisi.");
      return;
    }
    setTestingWaConn(true);
    const toastId = toast.loading(`Menguji koneksi WhatsApp & mengirim pesan ke ${waTestRecipient}...`);
    try {
      const res = await fetch("/api/whatsapp/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: (session?.user as any)?.role === "owner" ? (profile.waProvider || "waha") : "waha",
          recipientNumber: waTestRecipient,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message, { id: toastId, description: data.details, duration: 5000 });
        setShowWaTestModal(false);
        setWaTestRecipient("");
      } else {
        toast.error(data.message || data.error || "Uji koneksi gagal.", { id: toastId });
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.", { id: toastId });
    } finally {
      setTestingWaConn(false);
    }
  };

  const handleOpenPaymentDrawer = (payment?: PaymentItem) => {
    if (payment) {
      setEditingPayment(payment);
      setPaymentFormData({
        tipe: payment.tipe,
        namaBank: payment.namaBank || "",
        nomorRekening: payment.nomorRekening || "",
        namaPemilik: payment.namaPemilik || "",
        gambarQris: payment.gambarQris || "",
        urutan: payment.urutan.toString(),
      });
    } else {
      setEditingPayment(null);
      setPaymentFormData(paymentFormDefaults);
    }
    setShowPaymentDrawer(true);
  };

  const handleSavePaymentItem = async () => {
    setIsSavingPayment(true);
    try {
      const url = editingPayment ? `/api/bank-accounts/${editingPayment.id}` : "/api/bank-accounts";
      const method = editingPayment ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentFormData),
      });
      if (res.ok) {
        toast.success(editingPayment ? "Metode pembayaran diperbarui" : "Metode pembayaran ditambahkan");
        fetchPayments();
        setShowPaymentDrawer(false);
      } else {
        const d = await res.json();
        toast.error("Gagal menyimpan: " + (d.error || "error"));
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleTogglePaymentItem = async (id: string) => {
    try {
      const res = await fetch(`/api/bank-accounts/${id}/toggle`, { method: "PATCH" });
      if (res.ok) {
        toast.success("Status diperbarui");
        fetchPayments();
      }
    } catch {
      toast.error("Gagal memperbarui status.");
    }
  };

  const handleDeletePaymentItem = async (id: string) => {
    showConfirm({
      title: "Hapus Metode Pembayaran",
      message: "Yakin ingin menghapus metode pembayaran ini?",
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/bank-accounts/${id}`, { method: "DELETE" });
          if (res.ok) {
            toast.success("Metode pembayaran dihapus");
            fetchPayments();
          }
        } catch {
          toast.error("Gagal menghapus.");
        }
      }
    });
  };

  // Account / Password / Security handlers
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Password lama dan baru wajib diisi.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }
    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Password berhasil diperbarui!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Gagal mengubah password.");
      }
    } catch {
      toast.error("Gagal mengubah password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleChangeLang = async (lang: string) => {
    setIsSavingLang(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bahasa: lang }),
      });
      if (res.ok) {
        setAccount((c) => ({ ...c, bahasa: lang }));
        toast.success("Bahasa diperbarui!");
      }
    } catch {
      toast.error("Gagal menyimpan bahasa.");
    } finally {
      setIsSavingLang(false);
    }
  };

  const handleSaveSecurity = async () => {
    setIsSavingSecurity(true);
    try {
      toast.success("Pengaturan kebijakan data disimpan.");
    } finally {
      setIsSavingSecurity(false);
    }
  };

  // Filtering models dynamically inside list modal
  const filteredModels = dynamicModels.filter((m) =>
    m.id.toLowerCase().includes(searchModel.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 text-[#F1F5F9] animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-white/5 rounded w-20"></div>
          <div className="h-8 bg-white/5 rounded w-64"></div>
          <div className="h-4 bg-white/5 rounded w-96"></div>
        </div>

        {/* Tab & Form Split Skeleton */}
        <div className="grid gap-6 lg:grid-cols-[240px_1fr] pt-4">
          {/* Sidebar Tabs */}
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-11 bg-white/5 rounded-xl w-full"></div>
            ))}
          </div>
          {/* Main Card Form */}
          <div className="glass-card p-6 space-y-6">
            <div className="h-6 bg-white/5 rounded w-48 mb-4"></div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-3.5 bg-white/5 rounded w-24"></div>
                  <div className="h-10 bg-white/5 rounded w-full"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 bg-white/5 rounded w-32"></div>
                  <div className="h-10 bg-white/5 rounded w-full"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3.5 bg-white/5 rounded w-28"></div>
                <div className="h-28 bg-white/5 rounded w-full"></div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <div className="h-10 bg-white/5 rounded-xl w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Profil Toko", icon: Store },
    { id: "businesses", label: "Profil Bisnis & AI", icon: Building },
    { id: "bot", label: "WhatsApp & Otomasi", icon: Clock },
    { id: "ai", label: "Kredensial AI & Asisten", icon: Bot },
    { id: "payment", label: "Metode Pembayaran", icon: CreditCard },
    { id: "security", label: "Keamanan & Akun", icon: Shield },
  ];

  return (
    <div className="space-y-6 text-[#F1F5F9] relative pb-10">
      <div>
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Pengaturan Sistem</h1>
        <p className="text-[#94A3B8] text-sm mt-1">Konfigurasi profile, asisten AI, metode pembayaran dan keamanan platform Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6">
        {/* Left Side: Sidebar Tabs Navigation */}
        <div className="self-start lg:sticky lg:top-24 z-20">
          <div className="glass-card p-3 space-y-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all whitespace-nowrap lg:w-full ${
                    isActive
                      ? "bg-[#3B82F6] text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                      : "text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.02)]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#94A3B8]"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Tab Forms Panel */}
        <div className="space-y-6">
          
          {/* TAB 1: PROFIL TOKO */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="glass-card p-6 space-y-5">
                <h2 className="font-display text-xl font-bold text-white border-b border-[rgba(255,255,255,0.06)] pb-3">Profil Bisnis</h2>
                
                {/* Logo Sidebar Uploader */}
                <div className="bg-[rgba(255,255,255,0.02)] p-4 rounded-2xl border border-white/5 mb-2">
                  <h3 className="text-sm font-semibold text-white mb-1">Logo Sidebar Toko</h3>
                  <p className="text-[10px] text-[#93A8C7] mb-3">Unggah logo kustom Anda untuk ditampilkan di bagian kiri panel navigasi.</p>
                  {profile.logoUrl ? (
                    <div className="space-y-3">
                      {/* Preview */}
                      <div className="relative group w-full h-[160px] rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-white/5 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={profile.logoUrl}
                          alt="Pratinjau Logo Toko"
                          className="max-w-full max-h-full object-contain p-3"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/logo-velora.png"; }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setProfile((prev) => ({ ...prev, logoUrl: "" }))}
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white text-xs font-bold transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Hapus Logo
                          </button>
                        </div>
                      </div>
                      {/* Replace button */}
                      <label className="flex items-center justify-center gap-2 w-full py-2 border border-dashed border-[rgba(255,255,255,0.1)] hover:border-[#56D6FF]/40 rounded-xl text-xs text-[#69809F] hover:text-[#56D6FF] cursor-pointer transition-all">
                        <Upload className="h-3.5 w-3.5" />
                        Ganti Logo
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-[rgba(255,255,255,0.12)] hover:border-[#56D6FF]/50 bg-white/2 hover:bg-[#56D6FF]/5 rounded-xl p-8 cursor-pointer transition-all group">
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                      {uploadingLogo ? (
                        <div className="flex flex-col items-center gap-2 text-[#93A8C7]">
                          <Loader2 className="h-8 w-8 animate-spin text-[#56D6FF]" />
                          <span className="text-xs font-medium">Mengunggah...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-[#93A8C7] group-hover:text-[#F1F5F9]">
                          <div className="w-12 h-12 rounded-xl bg-[#56D6FF]/10 flex items-center justify-center group-hover:bg-[#56D6FF]/20 transition-all">
                            <Upload className="h-6 w-6 text-[#56D6FF]" />
                          </div>
                          <span className="text-xs font-semibold">Klik untuk unggah logo</span>
                          <span className="text-[10px] text-[#69809F]">PNG, JPG, SVG — Maks 2MB</span>
                        </div>
                      )}
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-[#93A8C7] mb-2">Nama Toko / Bisnis *</label>
                    <input
                      type="text"
                      value={profile.namaToko || ""}
                      onChange={(e) => setProfile((c) => ({ ...c, namaToko: e.target.value }))}
                      className="app-input"
                      placeholder="Nama Toko Anda"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#93A8C7] mb-2">Template Bisnis Aktif</label>
                    <div className="app-input flex items-center justify-between gap-3 cursor-default select-none">
                      <span className="text-[#F1F5F9] font-medium">
                        {tenantTypes.find(t => t.id === profile.tenantTypeId)?.name || (
                          <span className="text-[#64748B] italic">Belum dipilih</span>
                        )}
                      </span>
                      <a
                        href="/products"
                        className="shrink-0 text-[10px] text-[#56D6FF] hover:underline flex items-center gap-1"
                      >
                        Ubah di Katalog →
                      </a>
                    </div>
                    <p className="text-[10px] text-[#64748B] mt-1.5">Untuk mengubah template bisnis, buka menu Katalog.</p>
                  </div>
                </div>

                {/* Label Kustom Katalog & Pesanan */}
                <div className="bg-[rgba(86,214,255,0.03)] border border-[#56D6FF]/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#56D6FF]" />
                    <h3 className="text-xs font-bold text-[#56D6FF] uppercase tracking-wider">Kustomisasi Nama Menu</h3>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] -mt-2">Label ini tampil di sidebar navigasi dan seluruh halaman. Sesuaikan dengan jenis bisnis Anda.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#93A8C7] mb-2">
                        Nama Menu Katalog
                        <span className="ml-2 text-[10px] text-[#64748B] font-normal">contoh: Produk, Menu, Layanan, Kelas</span>
                      </label>
                      <input
                        type="text"
                        value={profile.catalogLabel || ""}
                        onChange={(e) => setProfile((c) => ({ ...c, catalogLabel: e.target.value }))}
                        className="app-input"
                        placeholder="Produk"
                        maxLength={50}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#93A8C7] mb-2">
                        Nama Menu Pesanan
                        <span className="ml-2 text-[10px] text-[#64748B] font-normal">contoh: Pesanan, Order, Booking, Pendaftaran</span>
                      </label>
                      <input
                        type="text"
                        value={profile.orderLabel || ""}
                        onChange={(e) => setProfile((c) => ({ ...c, orderLabel: e.target.value }))}
                        className="app-input"
                        placeholder="Pesanan"
                        maxLength={50}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#93A8C7] mb-2">Deskripsi Toko</label>
                  <textarea
                    value={profile.deskripsi || ""}
                    onChange={(e) => setProfile((c) => ({ ...c, deskripsi: e.target.value }))}
                    rows={4}
                    className="app-input resize-none"
                    placeholder="Tulis deskripsi toko Anda secara detail agar AI bisa memahaminya..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3">
                  <div>
                    <label className="block text-sm text-[#93A8C7] mb-2">Link Shopee</label>
                    <input
                      type="url"
                      value={profile.linkShopee || ""}
                      onChange={(e) => setProfile((c) => ({ ...c, linkShopee: e.target.value }))}
                      className="app-input"
                      placeholder="https://shopee.co.id/toko-anda"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#93A8C7] mb-2">Link TikTok Shop</label>
                    <input
                      type="url"
                      value={profile.linkTiktok || ""}
                      onChange={(e) => setProfile((c) => ({ ...c, linkTiktok: e.target.value }))}
                      className="app-input"
                      placeholder="https://tiktok.com/@toko-anda"
                    />
                  </div>
                </div>

                <div className="border-t border-[rgba(255,255,255,0.06)] pt-5 mt-4">
                  <h3 className="text-xs font-bold text-[#56D6FF] uppercase tracking-wider mb-3">Informasi WhatsApp Terhubung</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4 flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-[#4ADE80]" />
                      <div>
                        <p className="text-[10px] uppercase font-bold text-[#69809F]">Nomor WhatsApp</p>
                        <p className="text-white font-semibold text-sm">{profile.waNumber || "—"}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4 flex items-center gap-3">
                      <Wifi className="h-5 w-5 text-[#56D6FF]" />
                      <div>
                        <p className="text-[10px] uppercase font-bold text-[#69809F]">Gateway Provider</p>
                        <p className="text-white font-semibold text-sm">{profile.waProvider?.toUpperCase() || "—"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="app-button-primary w-full py-4 text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Simpan Profil Toko
              </button>
            </div>
          )}

          {/* TAB 2: WHATSAPP & OTOMASI */}
          {activeTab === "bot" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Sesi Akun WhatsApp (Multi-Device Management) */}
              {(profile.waProvider === "waha" || (session?.user as any)?.role !== "owner") && (
                <div className="glass-card p-6 space-y-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(255,255,255,0.06)] pb-4">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-6 w-6 text-[#56D6FF]" />
                      <div>
                        <h2 className="font-display text-xl font-bold text-white">Sesi Akun WhatsApp</h2>
                        <p className="text-xs text-[#93A8C7]">Hubungkan dan kelola akun WhatsApp Anda agar chatbot aktif.</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setShowWaTestModal(true);
                          setWaTestRecipient(profile.waNumber || "");
                        }}
                        disabled={testingWaConn}
                        className="px-3.5 py-2 bg-[#56D6FF]/10 hover:bg-[#56D6FF]/20 border border-[#56D6FF]/20 text-[#56D6FF] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Activity className="h-3.5 w-3.5" />
                        Test Koneksi
                      </button>
                      <button
                        type="button"
                        onClick={fetchWaSessions}
                        className="px-3 py-2 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] rounded-xl text-xs font-semibold text-[#93A8C7] flex items-center gap-1.5 transition-all"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refresh
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddWaModal(true); setWaSessionError(null); setWaLimitReached(false); }}
                        className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Tambah Nomor WA
                      </button>
                    </div>
                  </div>

                  {/* Error Banner */}
                  {waSessionError && (
                    <div className="flex items-start gap-3 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#EF4444]" />
                      <div className="flex-1">
                        <p className="text-sm text-[#EF4444]">{waSessionError}</p>
                        {waLimitReached && (
                          <p className="mt-1 text-xs text-[#93A8C7]">
                            Upgrade ke paket <strong>Pro</strong> untuk menambah lebih banyak nomor WhatsApp.
                          </p>
                        )}
                      </div>
                      <button type="button" onClick={() => setWaSessionError(null)}>
                        <X className="h-4 w-4 text-[#EF4444]" />
                      </button>
                    </div>
                  )}

                  {/* Sessions Grid */}
                  {loadingWaSessions ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] h-32 animate-pulse p-5" />
                      ))}
                    </div>
                  ) : waSessions.length === 0 ? (
                    <div className="rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] flex flex-col items-center justify-center gap-3 py-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
                        <Smartphone className="h-6 w-6" />
                      </div>
                      <p className="text-white text-sm font-semibold">Belum ada nomor WhatsApp yang terhubung.</p>
                      <p className="text-xs text-[#93A8C7]">Klik &ldquo;Tambah Nomor WA&rdquo; untuk menghubungkan akun WhatsApp Anda.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {waSessions.map((s) => (
                        <div key={s.id} className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 space-y-4 hover:border-[#3B82F6]/30 transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
                                <Smartphone className="h-4.5 w-4.5" />
                              </div>
                              <div>
                                <p className="font-semibold text-white text-sm">{s.label || "Akun WA"}</p>
                                <p className="text-xs text-[#69809F] font-mono">
                                  {s.waNumber || "Belum discan"}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteWaSession(s.id)}
                              className="rounded-lg p-1.5 text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-[#69809F] block">
                              Profil Bisnis Terhubung
                            </label>
                            <select
                              value={s.businessProfileId || ""}
                              onChange={(e) => handleLinkWaSession(s.id, e.target.value)}
                              className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0F1E] px-3 py-2 text-xs text-[#F1F5F9] focus:border-[#3B82F6] focus:outline-none"
                            >
                              <option value="" className="bg-[#0B1120] text-[#69809F]">-- Hubungkan ke Bisnis --</option>
                              {businessProfiles.map((p) => (
                                <option key={p.id} value={p.id} className="bg-[#0B1120] text-white">
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.04)]">
                            <StatusBadge status={s.status} />
                            {s.status === "qr_pending" && (
                              <button
                                type="button"
                                onClick={() =>
                                  setWaQrModal({
                                    sessionId: s.id,
                                    qrUrl: `/api/whatsapp/sessions/${s.id}`,
                                  })
                                }
                                className="text-xs text-[#3B82F6] hover:text-[#56D6FF] font-semibold underline"
                              >
                                Scan QR
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 space-y-5">
                  <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] pb-3">
                    <MessageSquare className="h-5 w-5 text-[#3B82F6]" />
                    <h2 className="font-display text-lg font-bold text-white">Templat Pesan Bot</h2>
                  </div>
                  <div>
                    <label className="block text-sm text-[#93A8C7] mb-2">Pesan Sambutan (Greeting)</label>
                    <textarea
                      value={botSettings.greeting}
                      onChange={(e) => setBotSettings((c) => ({ ...c, greeting: e.target.value }))}
                      rows={3}
                      className="app-input resize-none"
                      placeholder="Halo! Ada yang bisa kami bantu?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#93A8C7] mb-2">Pesan Offline (Di Luar Jam Buka)</label>
                    <textarea
                      value={botSettings.pesanOffline}
                      onChange={(e) => setBotSettings((c) => ({ ...c, pesanOffline: e.target.value }))}
                      rows={3}
                      className="app-input resize-none"
                      placeholder="Maaf, kami sedang offline."
                    />
                  </div>
                </div>

                <div className="glass-card p-6 space-y-5">
                  <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] pb-3">
                    <Clock className="h-5 w-5 text-[#FFBF69]" />
                    <h2 className="font-display text-lg font-bold text-white">Jam Operasional & Respon</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#93A8C7] mb-2">Jam Buka</label>
                      <input
                        type="time"
                        value={botSettings.jamBuka}
                        onChange={(e) => setBotSettings((c) => ({ ...c, jamBuka: e.target.value }))}
                        className="app-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#93A8C7] mb-2">Jam Tutup</label>
                      <input
                        type="time"
                        value={botSettings.jamTutup}
                        onChange={(e) => setBotSettings((c) => ({ ...c, jamTutup: e.target.value }))}
                        className="app-input"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-[rgba(255,255,255,0.06)] pt-4">
                    <div>
                      <label className="block text-sm text-[#93A8C7] mb-2">Delay Minimum (ms)</label>
                      <input
                        type="number"
                        value={botSettings.delayMin}
                        onChange={(e) => setBotSettings((c) => ({ ...c, delayMin: parseInt(e.target.value) || 0 }))}
                        className="app-input"
                        placeholder="2000"
                      />
                      <span className="text-[10px] text-[#69809F]">Min: 1000ms</span>
                    </div>
                    <div>
                      <label className="block text-sm text-[#93A8C7] mb-2">Delay Maximum (ms)</label>
                      <input
                        type="number"
                        value={botSettings.delayMax}
                        onChange={(e) => setBotSettings((c) => ({ ...c, delayMax: parseInt(e.target.value) || 0 }))}
                        className="app-input"
                        placeholder="5000"
                      />
                      <span className="text-[10px] text-[#69809F]">&gt; delay minimum</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card !overflow-visible p-6 space-y-4 lg:col-span-2">
                  <h3 className="text-sm font-bold text-[#56D6FF] uppercase tracking-wider">Status & Pengaturan Bahasa</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                      <div>
                        <span className="text-white text-sm font-semibold">AI Otomatis</span>
                        <p className="text-[10px] text-[#69809F] mt-1">Bot menjawab otomatis via AI</p>
                      </div>
                      <button onClick={() => setBotSettings((c) => ({ ...c, aiEnabled: !c.aiEnabled }))} className={botSettings.aiEnabled ? "text-[#4ADE80]" : "text-[#69809F]"}>
                        {botSettings.aiEnabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                      <div>
                        <span className="text-white text-sm font-semibold">Typing Indicator</span>
                        <p className="text-[10px] text-[#69809F] mt-1">Muncul status "Sedang Mengetik..."</p>
                      </div>
                      <button onClick={() => setBotSettings((c) => ({ ...c, typingIndicator: !c.typingIndicator }))} className={botSettings.typingIndicator ? "text-[#4ADE80]" : "text-[#69809F]"}>
                        {botSettings.typingIndicator ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-sm text-[#93A8C7] mb-2">Bahasa Default Asisten</label>
                    <CustomDropdown
                      value={botSettings.bahasaDefault}
                      onChange={(val) => setBotSettings((c) => ({ ...c, bahasaDefault: val }))}
                      options={[
                        { value: "id", label: "Bahasa Indonesia" },
                        { value: "en", label: "English" },
                      ]}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveBot}
                disabled={isSavingBot}
                className="app-button-primary w-full py-4 text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingBot ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Simpan Pengaturan Otomasi
              </button>
            </div>
          )}

          {/* TAB: PROFIL BISNIS & AI */}
          {activeTab === "businesses" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="glass-card p-6 space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(255,255,255,0.06)] pb-4">
                  <div className="flex items-center gap-3">
                    <Building className="h-6 w-6 text-[#3B82F6]" />
                    <div>
                      <h2 className="font-display text-xl font-bold text-white">Profil Bisnis / Brand</h2>
                      <p className="text-xs text-[#93A8C7]">Kelola berbagai profil bisnis, brand, atau asisten AI yang berbeda dalam toko Anda.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile(null);
                      setProfileForm(defaultProfileForm);
                      setShowProfileModal(true);
                    }}
                    className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Profil Bisnis
                  </button>
                </div>

                {loadingProfiles ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] h-48 animate-pulse" />
                    ))}
                  </div>
                ) : businessProfiles.length === 0 ? (
                  <div className="rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
                      <Building className="h-6 w-6" />
                    </div>
                    <p className="text-white text-sm font-semibold">Belum ada Profil Bisnis.</p>
                    <p className="text-xs text-[#93A8C7]">Klik &ldquo;Tambah Profil Bisnis&rdquo; untuk membuat asisten AI brand pertama Anda.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {businessProfiles.map((p) => {
                      const linkedWas = waSessions.filter((s) => s.businessProfileId === p.id);
                      return (
                        <div key={p.id} className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5 space-y-4 hover:border-[#3B82F6]/30 transition-all flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-white text-base">{p.name}</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-[#94A3B8] font-mono">Model: {p.model}</span>
                                  {p.tenantTypeId && (
                                    <>
                                      <span className="text-[#69809F] text-[10px]">•</span>
                                      <span className="text-[10px] text-[#56D6FF] font-medium">
                                        {tenantTypes.find(t => t.id === p.tenantTypeId)?.name || "Kategori"}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${p.aiEnabled ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20" : "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20"}`}>
                                  {p.aiEnabled ? "AI Aktif" : "AI Off"}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2 text-xs text-[#93A8C7]">
                              <div>
                                <span className="text-[10px] font-bold text-[#69809F] uppercase tracking-wider block mb-0.5">Pesan Penyambut (Greeting)</span>
                                <p className="line-clamp-2 italic bg-black/20 p-2 rounded-lg text-[11px] text-[#F1F5F9]">&ldquo;{p.greeting}&rdquo;</p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-[#69809F] uppercase tracking-wider block mb-0.5">System Prompt</span>
                                <p className="line-clamp-3 bg-black/20 p-2 rounded-lg text-[11px] font-mono leading-normal">{p.systemPrompt}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-[rgba(255,255,255,0.05)] mt-2">
                            <span className="text-[11px] text-[#69809F] font-semibold flex items-center gap-1">
                              <Link2 className="w-3 h-3" />
                              Terhubung ke: <span className="text-white font-bold">{linkedWas.length}</span> nomor WhatsApp
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProfile(p);
                                  setProfileForm(p);
                                  setShowProfileModal(true);
                                }}
                                className="p-2 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] rounded-xl text-xs font-semibold text-white flex items-center gap-1 transition-all"
                              >
                                <Edit className="h-3.5 w-3.5 text-[#3B82F6]" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Apakah Anda yakin ingin menghapus profil bisnis "${p.name}"?`)) {
                                    handleDeleteBusinessProfile(p.id);
                                  }
                                }}
                                className="p-2 bg-[rgba(255,255,255,0.04)] hover:bg-[#EF4444]/10 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs font-semibold text-[#EF4444] flex items-center gap-1 transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Tambah/Edit Profil Bisnis */}
          {showProfileModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
              <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl w-full max-w-lg my-8 p-6 text-[#F1F5F9] max-h-[90vh] overflow-y-auto flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.05)]">
                    <h2 className="text-lg font-semibold text-[#F1F5F9]">{editingProfile ? "Edit Profil Bisnis" : "Tambah Profil Bisnis"}</h2>
                    <button type="button" onClick={() => setShowProfileModal(false)} className="p-2 text-[#94A3B8] hover:text-white bg-[#1E293B] hover:bg-[#334155] rounded-full transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[#69809F] block mb-2">Nama Profil / Brand (Wajib)</label>
                        <input
                          type="text"
                          value={profileForm.name || ""}
                          onChange={(e) => setProfileForm(c => ({ ...c, name: e.target.value }))}
                          placeholder="Contoh: Toko Hijab, CS Billing"
                          className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm text-[#F1F5F9] placeholder:text-[#4A6080] focus:border-[#3B82F6] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[#69809F] block mb-2">Jenis Bisnis (Kategori)</label>
                        <select
                          value={profileForm.tenantTypeId || ""}
                          onChange={(e) => setProfileForm(c => ({ ...c, tenantTypeId: e.target.value || null }))}
                          className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm text-[#F1F5F9] focus:border-[#3B82F6] focus:outline-none"
                        >
                          <option value="" className="bg-[#0B1120] text-[#69809F]">-- Pilih Jenis Bisnis --</option>
                          {tenantTypes.map((t) => (
                            <option key={t.id} value={t.id} className="bg-[#0B1120] text-white">
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[#69809F] block mb-2">Model AI</label>
                        {!apiKey ? (
                          // Belum ada API Key → suruh konfigurasi dulu
                          <div className="flex items-center gap-2 rounded-xl border border-[#FFBF69]/30 bg-[#FFBF69]/5 px-4 py-3">
                            <AlertTriangle className="w-4 h-4 text-[#FFBF69] shrink-0" />
                            <p className="text-xs text-[#FFBF69]">Isi <span className="font-bold">API Key</span> dan <span className="font-bold">Base URL</span> di tab <span className="font-bold">Bot AI</span> terlebih dahulu, lalu kembali ke sini untuk memilih model.</p>
                          </div>
                        ) : dynamicModels.length > 0 ? (
                          // Ada model dari API → tampilkan dropdown dinamis
                          <select
                            value={profileForm.model || ""}
                            onChange={(e) => setProfileForm(c => ({ ...c, model: e.target.value }))}
                            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm text-[#F1F5F9] focus:border-[#3B82F6] focus:outline-none"
                          >
                            <option value="" className="bg-[#0B1120]">-- Pilih Model --</option>
                            {dynamicModels.map((m) => (
                              <option key={m.id} value={m.id} className="bg-[#0B1120]">
                                {m.id}{m.name && m.name !== m.id ? ` (${m.name})` : ""}
                              </option>
                            ))}
                          </select>
                        ) : (
                          // API Key ada tapi belum fetch model → tombol fetch + input manual
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={profileForm.model || ""}
                                onChange={(e) => setProfileForm(c => ({ ...c, model: e.target.value }))}
                                placeholder="Tulis nama model, misal: gpt-4o, claude-3-5-sonnet"
                                className="flex-1 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm text-[#F1F5F9] focus:border-[#3B82F6] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={fetchModels}
                                disabled={loadingModels}
                                className="px-3 py-2.5 bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 border border-[#3B82F6]/30 text-[#3B82F6] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                              >
                                {loadingModels ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                {loadingModels ? "Fetch..." : "Fetch Model"}
                              </button>
                            </div>
                            <p className="text-[10px] text-[#64748B]">Atau klik <span className="text-[#3B82F6] font-semibold">Fetch Model</span> untuk ambil daftar model otomatis dari provider yang dikonfigurasi di tab Bot AI.</p>
                          </div>
                        )}
                      </div>

                    <div className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.02)] rounded-xl border border-[rgba(255,255,255,0.04)]">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">Status Asisten AI</span>
                        <span className="text-[10px] text-[#93A8C7]">Aktifkan atau nonaktifkan respon otomatis AI untuk nomor yang menggunakan profil ini.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProfileForm(c => ({ ...c, aiEnabled: !c.aiEnabled }))}
                        className={`flex items-center gap-2 transition-colors ${profileForm.aiEnabled ? "text-[#10B981]" : "text-[#94A3B8]"}`}
                      >
                        {profileForm.aiEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-[#69809F] block mb-2">Pesan Selamat Datang (Greeting Message)</label>
                      <textarea
                        value={profileForm.greeting || ""}
                        onChange={(e) => setProfileForm(c => ({ ...c, greeting: e.target.value }))}
                        rows={3}
                        placeholder="Pesan yang otomatis dikirim saat ada pelanggan baru..."
                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm text-[#F1F5F9] focus:border-[#3B82F6] focus:outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-[#69809F] block mb-2">Pesan Offline</label>
                      <textarea
                        value={profileForm.pesanOffline || ""}
                        onChange={(e) => setProfileForm(c => ({ ...c, pesanOffline: e.target.value }))}
                        rows={3}
                        placeholder="Pesan yang dikirim saat di luar jam kerja..."
                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm text-[#F1F5F9] focus:border-[#3B82F6] focus:outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-[#69809F] block mb-2">System Prompt (Instruksi Dasar AI)</label>
                      <textarea
                        value={profileForm.systemPrompt || ""}
                        onChange={(e) => setProfileForm(c => ({ ...c, systemPrompt: e.target.value }))}
                        rows={5}
                        placeholder="Tentukan instruksi kepribadian AI, batasan jawaban, gaya bicara, dll..."
                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm text-[#F1F5F9] focus:border-[#3B82F6] focus:outline-none resize-none font-mono text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-5 border-t border-[rgba(255,255,255,0.05)] mt-5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1 rounded-xl border border-[rgba(255,255,255,0.08)] py-2.5 text-sm font-semibold text-[#93A8C7] hover:bg-[rgba(255,255,255,0.04)] transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBusinessProfile}
                    disabled={isSavingProfileItem}
                    className="flex-1 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isSavingProfileItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSavingProfileItem ? "Menyimpan..." : "Simpan Profil"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KREDENSIAL AI & ASISTEN */}
          {activeTab === "ai" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="glass-card !overflow-visible p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                  <h2 className="text-lg font-bold text-white">Integrasi Provider LLM</h2>
                  <button onClick={() => setAktif(!aktif)} className={`flex items-center gap-2 transition-colors ${aktif ? "text-[#10B981]" : "text-[#94A3B8]"}`}>
                    {aktif ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider">{aktif ? "Aktif" : "Nonaktif"}</span>
                  </button>
                </div>

                {/* Kredensial AI Form */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-[#56D6FF]" />
                    <h3 className="text-xs font-black text-[#56D6FF] uppercase tracking-widest">Kredensial API</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#94A3B8] mb-2 uppercase tracking-wider">AI Provider</label>
                      <CustomDropdown
                        value={provider}
                        onChange={(val) => {
                          setProvider(val);
                          setDynamicModels([]);
                        }}
                        options={[
                          { value: "openai", label: "OpenAI (Official)" },
                          { value: "anthropic", label: "Anthropic Claude (Official)" },
                          { value: "openai_compatible", label: "OpenAI Compatible (Groq, OpenRouter, dll.)" },
                          { value: "anthropic_compatible", label: "Anthropic Compatible (Custom Proxy)" },
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#94A3B8] mb-2 uppercase tracking-wider">API Key</label>
                      <div className="relative">
                        <input
                          type={showApiKey ? "text" : "password"}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={apiKey === "••••••••••••" ? "••••••••••••" : "Masukkan API Key..."}
                          className="w-full pl-4 pr-10 py-2.5 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {(provider === "openai_compatible" || provider === "anthropic_compatible") && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                      <label className="block text-[10px] font-bold text-[#94A3B8] mb-2 uppercase tracking-wider">Custom Base URL</label>
                      <input
                        type="text"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder={provider === "anthropic_compatible" ? "https://api.your-anthropic-proxy.com/v1" : "https://api.groq.com/openai/v1"}
                        className="w-full px-4 py-2 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                      />
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                      className="px-3.5 py-2 bg-[#1E293B] hover:bg-[#334155] border border-[rgba(255,255,255,0.08)] hover:border-[#3B82F6]/50 rounded-xl text-xs font-bold text-[#F1F5F9] flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {testingConnection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5 text-[#10B981]" />}
                      Tes Koneksi API
                    </button>
                  </div>
                </div>

                {/* Personalitas Bot */}
                <div className="space-y-4 border-t border-[rgba(255,255,255,0.06)] pt-4">
                  <h3 className="text-xs font-black text-[#56D6FF] uppercase tracking-widest">Personalitas & Instruksi</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#94A3B8] mb-2 uppercase tracking-wider">Nama Agent AI</label>
                      <input
                        type="text"
                        value={namaAgent}
                        onChange={(e) => setNamaAgent(e.target.value)}
                        placeholder="Contoh: Velora Assistant"
                        className="w-full px-4 py-2 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#94A3B8] mb-2 uppercase tracking-wider">AI Model</label>
                      <div
                        onClick={() => setIsModelModalOpen(true)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 bg-[#0A0F1E] rounded-xl cursor-pointer transition-colors group border ${!model ? 'border-[#FFBF69]/40 hover:border-[#FFBF69]/70' : 'border-[rgba(255,255,255,0.08)] hover:border-[#3B82F6]/50'}`}
                      >
                        <div className="flex flex-col gap-0.5">
                          {model ? (
                            <>
                              <span className="text-sm font-medium text-[#F1F5F9] truncate group-hover:text-[#3B82F6] transition-colors">{model}</span>
                              <span className="text-[9px] text-[#94A3B8] uppercase tracking-wider">{provider} provider</span>
                            </>
                          ) : (
                            <>
                              <span className="text-sm font-medium text-[#FFBF69] flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Pilih Model dari Provider...</span>
                              <span className="text-[9px] text-[#69809F]">Simpan API Key dulu, lalu klik untuk memilih model</span>
                            </>
                          )}
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-colors ${!model ? 'text-[#FFBF69]' : 'text-[#94A3B8] group-hover:text-[#3B82F6]'}`} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#94A3B8] mb-2 uppercase tracking-wider">Tone & Gaya Bicara</label>
                      <CustomDropdown
                        value={tone}
                        onChange={(val) => setTone(val)}
                        options={[
                          { value: "formal", label: "Formal" },
                          { value: "semi-formal", label: "Semi-formal" },
                          { value: "santai", label: "Santai" },
                        ]}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#94A3B8] mb-2 uppercase tracking-wider">System Prompt (Instruksi Dasar AI)</label>
                    <textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={5}
                      placeholder="Berikan instruksi spesifik tentang bagaimana AI harus menjawab..."
                      className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-[#F1F5F9] resize-none focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                    />
                    <p className="text-[10px] text-[#94A3B8] mt-2 italic">*Data produk, promo, dan FAQ akan otomatis dimasukkan sebagai konteks asisten saat bot berjalan.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveAi}
                disabled={isSavingAi}
                className="app-button-primary w-full py-4 text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingAi ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Simpan Konfigurasi AI
              </button>
            </div>
          )}

          {/* TAB 4: METODE PEMBAYARAN */}
          {activeTab === "payment" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Payment gateway: Pakasir */}
              <div className="glass-card p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] pb-3">
                  <Store className="h-5 w-5 text-[#4ADE80]" />
                  <h2 className="font-display text-xl font-bold text-white">Gateway Otomatis (Pakasir)</h2>
                </div>
                <p className="text-xs text-[#93A8C7]">Isi kredensial ini jika Anda menggunakan gateway pembayaran otomatis dari Pakasir. Jika dikosongkan, bot akan menginfokan pembayaran transfer manual.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-[#93A8C7] mb-2">Pakasir Project Slug</label>
                    <input
                      type="text"
                      value={profile.pakasirProjectSlug || ""}
                      onChange={(e) => setProfile((c) => ({ ...c, pakasirProjectSlug: e.target.value }))}
                      className="app-input"
                      placeholder="contoh: velora-id"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#93A8C7] mb-2">Pakasir API Key</label>
                    <input
                      type="text"
                      value={profile.pakasirApiKey || ""}
                      onChange={(e) => setProfile((c) => ({ ...c, pakasirApiKey: e.target.value }))}
                      className="app-input"
                      placeholder="pk_..."
                    />
                  </div>
                </div>

                {profile.pakasirWebhookUrl && (
                  <div className="border-t border-[rgba(255,255,255,0.06)] pt-4 mt-2">
                    <label className="block text-xs font-bold text-[#4ADE80] uppercase tracking-wider mb-2">Pakasir Webhook URL (Callback)</label>
                    <p className="text-xs text-[#93A8C7] mb-3">Salin URL callback di bawah ini dan tempelkan di dashboard Developer Pakasir Anda agar status order otomatis terkonfirmasi LUNAS.</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={profile.pakasirWebhookUrl}
                        className="flex-1 app-input bg-[#080d1a] border-[rgba(255,255,255,0.05)] text-slate-300 text-xs font-mono select-all cursor-default"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(profile.pakasirWebhookUrl || "");
                          toast.success("Webhook URL berhasil disalin!");
                        }}
                        className="px-4 py-2.5 bg-[#1E293B] hover:bg-[#334155] border border-[rgba(255,255,255,0.08)] hover:border-[#3B82F6]/50 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all shrink-0"
                      >
                        <Copy className="w-4 h-4 text-[#4ADE80]" />
                        Salin
                      </button>
                    </div>
                  </div>
                )}

                 {/* Panduan Integrasi Pakasir */}
                <div className="bg-[rgba(74,222,128,0.02)] border border-[#4ADE80]/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#4ADE80] uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Panduan Integrasi &amp; Pendaftaran Pakasir
                    </h3>
                    <a
                      href="https://app.pakasir.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#56D6FF] hover:underline flex items-center gap-1 font-semibold"
                    >
                      Buka Web Pakasir <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-3">
                      <div className="flex gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#4ADE80]/15 border border-[#4ADE80]/30 flex items-center justify-center text-[10px] font-bold text-[#4ADE80] shrink-0 mt-0.5">1</span>
                        <div>
                          <p className="font-semibold text-white">Daftar Akun Pakasir</p>
                          <p className="text-[11px] text-[#93A8C7] mt-0.5">Buka website Pakasir, buat akun baru untuk bisnis Anda, lalu lakukan verifikasi WhatsApp.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#4ADE80]/15 border border-[#4ADE80]/30 flex items-center justify-center text-[10px] font-bold text-[#4ADE80] shrink-0 mt-0.5">2</span>
                        <div>
                          <p className="font-semibold text-white">Buat Project Baru</p>
                          <p className="text-[11px] text-[#93A8C7] mt-0.5">Masuk ke dashboard Pakasir, buat project baru, dan salin <strong>Project Slug</strong> yang Anda buat.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#4ADE80]/15 border border-[#4ADE80]/30 flex items-center justify-center text-[10px] font-bold text-[#4ADE80] shrink-0 mt-0.5">3</span>
                        <div>
                          <p className="font-semibold text-white">Dapatkan API Key</p>
                          <p className="text-[11px] text-[#93A8C7] mt-0.5">Buka halaman profil atau pengaturan developer di Pakasir untuk mendapatkan <strong>API Key</strong> Anda.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#4ADE80]/15 border border-[#4ADE80]/30 flex items-center justify-center text-[10px] font-bold text-[#4ADE80] shrink-0 mt-0.5">4</span>
                        <div>
                          <p className="font-semibold text-white">Pasang Webhook URL</p>
                          <p className="text-[11px] text-[#93A8C7] mt-0.5">Salin <strong>Webhook URL (Callback)</strong> di atas, lalu tempelkan di dashboard Developer/Project Pakasir Anda agar status pembayaran sinkron otomatis.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTestPakasir}
                    disabled={testingPakasir}
                    className="px-5 py-2 bg-[#56D6FF]/10 hover:bg-[#56D6FF]/20 border border-[#56D6FF]/20 text-[#56D6FF] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {testingPakasir ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                    Tes Koneksi Pakasir
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="app-button-primary py-2 px-6 flex items-center gap-2 disabled:opacity-50 text-xs font-bold"
                  >
                    {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Simpan Gateway Pakasir
                  </button>
                </div>
              </div>

              {/* Payment Methods: Manual Transfer & QRIS */}
              <div className="glass-card p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-[#67A7FF]" />
                    <h2 className="font-display text-xl font-bold text-white">Pembayaran Manual (Transfer / QRIS)</h2>
                  </div>
                  <button
                    onClick={() => handleOpenPaymentDrawer()}
                    className="app-button-primary py-2 px-4 flex items-center gap-2 text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Rekening
                  </button>
                </div>
                <p className="text-xs text-[#93A8C7]">Daftar rekening bank manual atau QRIS statis yang akan diinfokan bot kepada pelanggan.</p>

                {payments.length === 0 ? (
                  <div className="py-10 text-center rounded-2xl border border-dashed border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]">
                    <CreditCard className="mx-auto h-10 w-10 text-slate-500 mb-3" />
                    <p className="text-sm text-[#93A8C7]">Belum ada metode pembayaran manual. Klik "Tambah Rekening" untuk menambahkan.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {payments.sort((a, b) => a.urutan - b.urutan).map((p) => (
                      <div key={p.id} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0B1120] p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.04)]">
                            {p.tipe === "transfer" ? <Building className="h-5 w-5 text-[#67A7FF]" /> : <QrCode className="h-5 w-5 text-[#4ADE80]" />}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-white">{p.tipe === "transfer" ? p.namaBank : "QRIS Statis"}</p>
                            <p className="text-xs text-[#93A8C7]">{p.tipe === "transfer" ? `${p.nomorRekening} a/n ${p.namaPemilik}` : "Scan gambar QRIS untuk bayar"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-500 font-bold">Urutan: {p.urutan}</span>
                          <button onClick={() => handleTogglePaymentItem(p.id)} className={p.aktif ? "text-[#4ADE80]" : "text-[#69809F]"}>
                            {p.aktif ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                          </button>
                          <button
                            onClick={() => handleOpenPaymentDrawer(p)}
                            className="p-2 border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.04)] rounded-xl transition-all"
                          >
                            <Edit className="w-3.5 h-3.5 text-[#93A8C7] hover:text-white" />
                          </button>
                          <button
                            onClick={() => handleDeletePaymentItem(p.id)}
                            className="p-2 border border-[rgba(255,107,122,0.12)] hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-300" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: KEAMANAN & AKUN */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Account Profile Details */}
              <div className="glass-card p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] pb-3">
                  <User className="h-5 w-5 text-[#3B82F6]" />
                  <h2 className="font-display text-xl font-bold text-white">Profil Pengguna</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
                    <p className="text-[10px] uppercase font-bold text-[#69809F]">Nama Akun</p>
                    <p className="mt-1 text-white font-semibold text-sm">{account.nama}</p>
                  </div>
                  <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
                    <p className="text-[10px] uppercase font-bold text-[#69809F]">Email Login</p>
                    <p className="mt-1 text-white font-semibold text-sm">{account.email}</p>
                  </div>
                </div>
              </div>

              {/* Password & Language change grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 space-y-5">
                  <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] pb-3">
                    <Lock className="h-5 w-5 text-red-400" />
                    <h2 className="font-display text-lg font-bold text-white">Ganti Password</h2>
                  </div>
                  <div>
                    <label className="block text-sm text-[#93A8C7] mb-2">Password Lama</label>
                    <div className="relative">
                      <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="app-input pr-12 text-sm" placeholder="••••••••" />
                      <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#69809F]">
                        {showCurrent ? <EyeOff className="h-4 h-4" /> : <Eye className="h-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-[#93A8C7] mb-2">Password Baru</label>
                    <div className="relative">
                      <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="app-input pr-12 text-sm" placeholder="Minimal 6 karakter" />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#69809F]">
                        {showNew ? <EyeOff className="h-4 h-4" /> : <Eye className="h-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-[#93A8C7] mb-2">Ulangi Password Baru</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="app-input text-sm" placeholder="Konfirmasi password baru" />
                  </div>
                  <button onClick={handleChangePassword} disabled={isSavingPassword} className="app-button-primary w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold disabled:opacity-50">
                    {isSavingPassword ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : <><Save className="h-4 w-4" /> Perbarui Password</>}
                  </button>
                </div>

                <div className="glass-card p-6 space-y-5">
                  <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] pb-3">
                    <Globe className="h-5 w-5 text-[#4ADE80]" />
                    <h2 className="font-display text-lg font-bold text-white">Preferensi Bahasa</h2>
                  </div>
                  <div className="space-y-3">
                    {[
                      { value: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
                      { value: "en", label: "English", flag: "🇺🇸" },
                    ].map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => handleChangeLang(lang.value)}
                        disabled={isSavingLang}
                        className={`w-full rounded-2xl border p-4 text-left transition-all ${
                          account.bahasa === lang.value
                            ? "border-[#3B82F6]/50 bg-[#3B82F6]/10"
                            : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.15)]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{lang.flag}</span>
                          <span className="font-semibold text-sm text-white">{lang.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bot Security Policies */}
              <div className="glass-card p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] pb-3">
                  <Shield className="h-5 w-5 text-[#FFBF69]" />
                  <h2 className="font-display text-xl font-bold text-white">Kebijakan Proteksi Chat & Webhook</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-[#93A8C7] mb-2">Batas Request Webhook per Menit per Kontak</label>
                    <input type="number" value={rateLimitPerMinute} onChange={(e) => setRateLimitPerMinute(e.target.value)} className="app-input text-sm" placeholder="30" />
                    <span className="text-[10px] text-[#69809F] mt-1 block">Batas antrian rate-limit WhatsApp masuk untuk mencegah spamming server.</span>
                  </div>
                  <div>
                    <label className="block text-sm text-[#93A8C7] mb-2">Masa Retensi Chat Log (hari)</label>
                    <input type="number" value={dataRetentionDays} onChange={(e) => setDataRetentionDays(e.target.value)} className="app-input text-sm" placeholder="90" />
                    <span className="text-[10px] text-[#69809F] mt-1 block">Log pesan lebih lama dari hari di atas akan otomatis dihapus oleh cron job.</span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                  <div>
                    <span className="text-white text-sm font-semibold">Aktifkan Callback Webhook WhatsApp</span>
                    <p className="text-[10px] text-[#69809F] mt-1">Status aktif untuk mengalirkan pesan WhatsApp masuk ke sistem Velora</p>
                  </div>
                  <button onClick={() => setWebhookEnabled(!webhookEnabled)} className={webhookEnabled ? "text-[#4ADE80]" : "text-[#69809F]"}>
                    {webhookEnabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                  </button>
                </div>

                <div className="rounded-xl border border-[rgba(255,191,105,0.16)] bg-[rgba(255,191,105,0.04)] p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-[#FFBF69] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#FFBF69] leading-5">Rate limiting dan kebijakan retensi data dipasang secara in-memory untuk stabilitas operasional. Perubahan opsi retensi mungkin membutuhkan waktu 24 jam untuk pemrosesan cron job.</p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveSecurity}
                    disabled={isSavingSecurity}
                    className="app-button-primary py-2 px-6 flex items-center gap-2 text-xs font-bold"
                  >
                    {isSavingSecurity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Simpan Proteksi
                  </button>
                </div>
              </div>

              {/* S3 Storage Diagnostik */}
              <div className="glass-card p-6 space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                  <div className="flex items-center gap-3">
                    <Upload className="h-6 w-6 text-[#56D6FF]" />
                    <div>
                      <h2 className="font-display text-xl font-bold text-white">Diagnostik S3 Storage</h2>
                      <p className="text-xs text-[#93A8C7]">Uji koneksi penyimpanan berkas global sistem.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestS3}
                    disabled={testingS3}
                    className="px-5 py-2.5 bg-[#56D6FF]/10 hover:bg-[#56D6FF]/20 border border-[#56D6FF]/20 text-[#56D6FF] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0 self-start sm:self-center"
                  >
                    {testingS3 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                    Tes Koneksi S3 Storage
                  </button>
                </div>
                <p className="text-xs text-[#93A8C7] leading-relaxed">
                  Uji koneksi ke Object Storage S3 (RustFS/MinIO) menggunakan environment variables server (<code>S3_ENDPOINT</code>, <code>S3_BUCKET</code>, dll.) untuk memastikan pengunggahan file/logo toko berjalan dengan lancar.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Model Picker Modal (Tab 3) */}
      {isModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden text-[#F1F5F9]">
            <div className="flex items-center justify-between p-5 border-b border-[rgba(255,255,255,0.05)] shrink-0">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#F1F5F9]">Pilih Model AI</h3>
                <p className="text-xs text-[#94A3B8]">Daftar model yang terdeteksi aktif untuk API Key provider terpilih.</p>
              </div>
              <button onClick={() => setIsModelModalOpen(false)} className="p-2 text-[#94A3B8] hover:text-white bg-[#1E293B] hover:bg-[#334155] rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 shrink-0 bg-[#0B1120] border-b border-[rgba(255,255,255,0.02)]">
              <input
                type="text"
                placeholder="Cari nama model..."
                value={searchModel}
                onChange={(e) => setSearchModel(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0f172a] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] placeholder:text-[#475569] transition-all"
              />
            </div>

            <div className="overflow-y-auto p-2">
              <div className="flex flex-col gap-1.5 p-2">
                {loadingModels ? (
                  <div className="text-center py-10 text-[#64748B] flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
                    <p className="text-sm">Menghubungi provider LLM...</p>
                  </div>
                ) : filteredModels.map((m) => {
                  const isSelected = model === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setModel(m.id);
                        setIsModelModalOpen(false);
                      }}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer rounded-xl transition-all border ${isSelected ? 'bg-[#3B82F6]/10 border-[#3B82F6]/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-transparent border-transparent hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.05)]'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-[#3B82F6]' : 'border-[#475569]'}`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />}
                        </div>
                        <div className="space-y-1">
                          <span className={`font-semibold text-sm ${isSelected ? 'text-[#3B82F6]' : 'text-[#F1F5F9]'}`}>{m.id}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="hidden sm:flex items-center justify-center bg-[#3B82F6] text-white rounded-full p-1.5">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
                {!loadingModels && filteredModels.length === 0 && (
                  <div className="text-center py-10 text-[#64748B]">
                    <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-20 text-yellow-500" />
                    <p className="text-sm">Tidak ada model terdeteksi.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Payment Drawer (Tab 4) */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${showPaymentDrawer ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="absolute inset-0 bg-[rgba(2,8,15,0.78)] backdrop-blur-sm" onClick={() => setShowPaymentDrawer(false)} />
        <div className={`drawer-shell absolute right-0 top-0 h-full w-full max-w-lg border-l border-[rgba(138,180,248,0.12)] bg-[#0B1120] text-[#F1F5F9] transition-transform duration-300 ${showPaymentDrawer ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex h-full flex-col">
            <div className="border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF] font-bold">Payment Editor</p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-white">{editingPayment ? "Edit Rekening" : "Tambah Rekening"}</h2>
                </div>
                <button onClick={() => setShowPaymentDrawer(false)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(138,180,248,0.12)] text-[#93A8C7] hover:bg-[rgba(255,255,255,0.05)]">✕</button>
              </div>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <div>
                <label className="mb-2 block text-sm text-[#93A8C7]">Tipe Rekening *</label>
                <CustomDropdown
                  value={paymentFormData.tipe}
                  onChange={(val) => setPaymentFormData((c) => ({ ...c, tipe: val as "transfer" | "qris" }))}
                  options={[
                    { value: "transfer", label: "Transfer Bank" },
                    { value: "qris", label: "QRIS Statis" },
                  ]}
                />
              </div>
              {paymentFormData.tipe === "transfer" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm text-[#93A8C7]">Nama Bank *</label>
                    <input type="text" value={paymentFormData.namaBank} onChange={(e) => setPaymentFormData((c) => ({ ...c, namaBank: e.target.value }))} className="app-input" placeholder="BCA, Mandiri, dll." />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-[#93A8C7]">Nomor Rekening *</label>
                    <input type="text" value={paymentFormData.nomorRekening} onChange={(e) => setPaymentFormData((c) => ({ ...c, nomorRekening: e.target.value }))} className="app-input" placeholder="1234567890" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-[#93A8C7]">Nama Pemilik Rekening *</label>
                    <input type="text" value={paymentFormData.namaPemilik} onChange={(e) => setPaymentFormData((c) => ({ ...c, namaPemilik: e.target.value }))} className="app-input" placeholder="Nama sesuai rekening" />
                  </div>
                </>
              )}
              {paymentFormData.tipe === "qris" && (
                <div>
                  <label className="mb-2 block text-sm text-[#93A8C7]">Gambar QRIS (Statis)</label>
                  {paymentFormData.gambarQris ? (
                    <div className="space-y-2">
                      {/* Preview */}
                      <div className="relative group w-full h-[180px] rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-white/5 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={paymentFormData.gambarQris}
                          alt="Pratinjau QRIS"
                          className="max-w-full max-h-full object-contain p-2"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setPaymentFormData((c) => ({ ...c, gambarQris: "" }))}
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white text-xs font-bold transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Hapus QRIS
                          </button>
                        </div>
                      </div>
                      {/* Replace / URL edit buttons */}
                      <div className="flex gap-2">
                        <label className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-dashed border-[rgba(255,255,255,0.1)] hover:border-[#56D6FF]/40 rounded-xl text-xs text-[#69809F] hover:text-[#56D6FF] cursor-pointer transition-all">
                          {uploadingQris ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                          {uploadingQris ? "Mengunggah..." : "Ganti Gambar"}
                          <input type="file" className="hidden" accept="image/*" onChange={handleQrisUpload} disabled={uploadingQris} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-[rgba(255,255,255,0.12)] hover:border-[#56D6FF]/50 bg-white/2 hover:bg-[#56D6FF]/5 rounded-xl p-6 cursor-pointer transition-all group">
                      <input type="file" className="hidden" accept="image/*" onChange={handleQrisUpload} disabled={uploadingQris} />
                      {uploadingQris ? (
                        <div className="flex flex-col items-center gap-2 text-[#93A8C7]">
                          <Loader2 className="h-8 w-8 animate-spin text-[#56D6FF]" />
                          <span className="text-xs font-medium">Mengunggah QRIS...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-[#93A8C7] group-hover:text-[#F1F5F9]">
                          <div className="w-12 h-12 rounded-xl bg-[#56D6FF]/10 flex items-center justify-center group-hover:bg-[#56D6FF]/20 transition-all">
                            <QrCode className="h-6 w-6 text-[#56D6FF]" />
                          </div>
                          <span className="text-xs font-semibold">Klik untuk unggah gambar QRIS</span>
                          <span className="text-[10px] text-[#69809F]">PNG, JPG — Maks 5MB</span>
                        </div>
                      )}
                    </label>
                  )}
                </div>
              )}
              <div>
                <label className="mb-2 block text-sm text-[#93A8C7]">Urutan Urutan Tampil</label>
                <input type="number" value={paymentFormData.urutan} onChange={(e) => setPaymentFormData((c) => ({ ...c, urutan: e.target.value }))} className="app-input" placeholder="0" />
              </div>
            </div>
            <div className="flex gap-3 border-t border-[rgba(255,255,255,0.08)] px-6 py-5 shrink-0">
              <button onClick={() => setShowPaymentDrawer(false)} className="app-button-secondary flex-1">Batal</button>
              <button onClick={handleSavePaymentItem} disabled={isSavingPayment} className="app-button-primary flex-1 disabled:opacity-50">
                {isSavingPayment ? "Menyimpan..." : "Simpan Rekening"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add WhatsApp Session Modal */}
      {showAddWaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl w-full max-w-lg p-6 text-[#F1F5F9]">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.05)]">
              <h2 className="text-lg font-semibold text-[#F1F5F9]">Tambah Nomor WhatsApp</h2>
              <button type="button" onClick={() => setShowAddWaModal(false)} className="p-2 text-[#94A3B8] hover:text-white bg-[#1E293B] hover:bg-[#334155] rounded-full transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-xs text-[#93A8C7] leading-relaxed">
              Sesi baru akan dibuat di WAHA. Masukkan nama sesi terlebih dahulu sebelum memunculkan QR Code agar mempermudah pelacakan (tracking).
            </p>
            {waSessionError && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold leading-relaxed">
                {waSessionError}
              </div>
            )}
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs uppercase font-bold tracking-wider text-[#69809F] block mb-2">
                  Nama Sesi / Label Akun (Wajib)
                </label>
                <input
                  value={waLabelInput}
                  onChange={(e) => setWaLabelInput(e.target.value)}
                  placeholder="Contoh: CS Utama, Toko Cabang"
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm text-[#F1F5F9] placeholder:text-[#4A6080] focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWaModal(false)}
                  className="flex-1 rounded-xl border border-[rgba(255,255,255,0.08)] py-2.5 text-sm font-semibold text-[#93A8C7] hover:bg-[rgba(255,255,255,0.04)] transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAddWaSession}
                  disabled={addingWaSession}
                  className="flex-1 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
                >
                  {addingWaSession ? "Memproses..." : "Buat Sesi & Scan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp QR Code Modal */}
      {waQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col items-center gap-4 p-6 text-center text-[#F1F5F9]">
            <div className="flex items-center justify-between w-full pb-2 border-b border-[rgba(255,255,255,0.05)]">
              <h2 className="text-lg font-semibold text-[#F1F5F9]">Scan QR Code</h2>
              <button type="button" onClick={() => setWaQrModal(null)} className="p-2 text-[#94A3B8] hover:text-white bg-[#1E293B] hover:bg-[#334155] rounded-full transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex h-52 w-52 items-center justify-center rounded-2xl bg-white p-3 shadow-inner mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={waQrModal.qrUrl} alt="QR Code WhatsApp" className="h-full w-full object-contain" />
            </div>
            <div className="flex items-start gap-2.5 rounded-xl bg-[#4ADE80]/10 p-3 text-left border border-[#4ADE80]/20">
              <Check className="h-4 w-4 text-[#4ADE80] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#4ADE80] leading-relaxed">
                Buka WhatsApp Anda, pilih Perangkat Tertaut, lalu Tautkan Perangkat dan arahkan kamera ke QR Code di atas.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (waQrModal?.sessionId) {
                  try {
                    await fetch(`/api/whatsapp/sessions/${waQrModal.sessionId}/sync`, { method: "POST" });
                  } catch {}
                }
                setWaQrModal(null);
                await fetchWaSessions();
              }}
              className="w-full rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] py-2.5 text-sm font-bold text-white transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            >
              Sudah Scan, Refresh Status
            </button>
          </div>
        </div>
      )}

      {/* Test WhatsApp Connection Modal */}
      {showWaTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl w-full max-w-lg p-6 text-[#F1F5F9] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.05)]">
              <h2 className="text-lg font-semibold text-[#F1F5F9]">Tes Koneksi WhatsApp Bot</h2>
              <button type="button" onClick={() => setShowWaTestModal(false)} className="p-2 text-[#94A3B8] hover:text-white bg-[#1E293B] hover:bg-[#334155] rounded-full transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-[#93A8C7] leading-relaxed">
              Uji koneksi gateway WhatsApp {profile.waProvider?.toUpperCase()} sekaligus kirim pesan uji coba. Masukkan nomor WhatsApp penerima (gunakan format internasional, contoh: 628123456789).
            </p>
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-wider text-[#69809F] block">
                Nomor WhatsApp Penerima
              </label>
              <input
                value={waTestRecipient}
                onChange={(e) => setWaTestRecipient(e.target.value)}
                placeholder="Contoh: 628123456789"
                className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
              />
            </div>
            <button
              type="button"
              onClick={handleTestWaWithMessage}
              disabled={testingWaConn}
              className="w-full rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] py-3 text-sm font-bold text-white transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {testingWaConn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
              Kirim Pesan Tes & Uji Koneksi
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        cancelLabel={confirmConfig.cancelLabel}
        onConfirm={() => {
          confirmConfig.onConfirm();
          closeConfirm();
        }}
        onCancel={closeConfirm}
        isDanger={confirmConfig.isDanger}
      />

    </div>
  );
}
