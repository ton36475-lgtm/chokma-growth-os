import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BadgePercent,
  BarChart3,
  CircleDollarSign,
  Crown,
  Gift,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const registrationUrl = "https://xn--42cl4e4cwd.net/auth/registration?af=u2vZe3xLLiJ7";

const uspCards = [
  {
    icon: Gift,
    title: "เครดิตฟรีรวม 100,000 บาท",
    description: "ใช้โปรโมชันต้อนรับเพื่อดึงผู้เล่นใหม่ และเร่งการเปลี่ยนจากผู้ชมเป็นผู้สมัครให้เร็วขึ้น",
  },
  {
    icon: BadgePercent,
    title: "แนะนำเพื่อนรับ 1% ถึง 3%",
    description: "วางข้อเสนอแบบขั้นบันได 5 คนรับ 1%, 10 คนรับ 2% และ 50 คนรับ 3% เพื่อเร่งการเติบโตเชิง referral พร้อมเชื่อมกับ campaign attribution",
  },
  {
    icon: Crown,
    title: "เน้นลูกค้าขาใหญ่และสายหวยจริงจัง",
    description: "ออกแบบ copy และเส้นทาง conversion ให้เหมาะกับผู้เล่นที่ต้องการความมั่นคง ความสะดวก และการดูแลต่อเนื่อง",
  },
];

const trustPoints = [
  "รองรับมือถือแบบเต็มรูปแบบ พร้อมปุ่มสมัครที่กดได้ทันทีทุกช่วงของหน้าและคงเอกลักษณ์แบรนด์ CHOKMA เท่านั้น",
  "วัดผลต้นทางแคมเปญผ่าน UTM tracking และ referrer capture อัตโนมัติ พร้อมแยกคุณภาพทราฟฟิกอย่างโปร่งใสเพื่อการวิเคราะห์",
  "เชื่อมต่อไปยัง CRM และ dashboard เพื่อติดตาม lead คุณภาพสูงกับผลลัพธ์จริง",
  "รองรับการต่อยอดจาก workflow broadcast และการจัดการลูกค้าปลาวาฬในระบบเดียว",
];

const faqItems = [
  {
    q: "ระบบนี้ช่วยทีม acquisition อย่างไร",
    a: "หน้าแลนดิ้งนี้ออกแบบให้รับลีดจริงพร้อมข้อมูลแหล่งที่มาแคมเปญ เพื่อให้ทีมสามารถรู้ได้ทันทีว่าทราฟฟิกใดสร้างผลลัพธ์ดีที่สุดและควรเพิ่มงบตรงไหนต่อ",
  },
  {
    q: "ทำไมต้องมี lead form ทั้งที่มีลิงก์สมัครตรง",
    a: "ลิงก์สมัครตรงยังจำเป็นต่อ conversion แต่การมี lead form ช่วยเก็บข้อมูลสำหรับการติดตาม การแบ่งกลุ่ม VIP และการวัด actual versus result เมื่อเทียบกับงบที่ใช้ไปจริง",
  },
  {
    q: "ระบบนี้รองรับการขยายต่อไปด้าน CRM หรือ broadcast หรือไม่",
    a: "รองรับ โดยข้อมูล lead, notes, deposit และ queue ถูกออกแบบให้อยู่ในสถาปัตยกรรมเดียวกันตั้งแต่ต้น จึงต่อยอดสู่การติดตามลูกค้าขาใหญ่และการย้ายจาก manual broadcast ได้อย่างเป็นระบบ",
  },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const submitLead = trpc.leads.submit.useMutation({
    onSuccess: () => {
      toast.success("บันทึกข้อมูลเรียบร้อยแล้ว ทีมงานสามารถติดตาม lead นี้ต่อใน CRM ได้ทันที");
      setForm((prev) => ({ ...prev, fullName: "", phone: "", lineId: "", notes: "" }));
    },
    onError: (error) => {
      toast.error(error.message || "เกิดข้อผิดพลาดระหว่างบันทึก lead");
    },
  });

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    lineId: "",
    notes: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmContent: "",
    utmTerm: "",
    referrer: "",
    landingPage: "",
    deviceType: "unknown" as "mobile" | "desktop" | "tablet" | "unknown",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const width = window.innerWidth;
    const nextDeviceType = width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop";

    setForm((prev) => ({
      ...prev,
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
      utmContent: params.get("utm_content") || "",
      utmTerm: params.get("utm_term") || "",
      referrer: document.referrer || "direct",
      landingPage: window.location.pathname + window.location.search,
      deviceType: nextDeviceType,
    }));
  }, []);

  const structuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Chokma Growth Landing Page",
      description:
        "Landing Page สำหรับรับ lead คุณภาพสูง พร้อมระบบติดตาม UTM, CRM และ dashboard สำหรับทีมการตลาดของ โชคมา.net",
      url: typeof window !== "undefined" ? window.location.href : "https://xn--42cl4e4cwd.net",
      mainEntity: {
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    }),
    [],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitLead.mutate({
      fullName: form.fullName || undefined,
      phone: form.phone || undefined,
      lineId: form.lineId || undefined,
      notes: form.notes || undefined,
      utmSource: form.utmSource || undefined,
      utmMedium: form.utmMedium || undefined,
      utmCampaign: form.utmCampaign || undefined,
      utmContent: form.utmContent || undefined,
      utmTerm: form.utmTerm || undefined,
      landingPage: form.landingPage || undefined,
      referrer: form.referrer || undefined,
      deviceType: form.deviceType,
      primaryIntent: "high-value lottery prospect",
      predictedValueScore: 85,
      sourceType: form.utmSource ? "ad" : "manual",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Chokma Growth OS</p>
            <h1 className="text-sm font-semibold sm:text-base">Full-Stack Marketing & CRM Platform</h1>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button asChild variant="outline" className="border-primary/30 bg-background text-foreground">
                <a href="/dashboard">เปิด Dashboard</a>
              </Button>
            ) : (
              <Button variant="outline" className="border-primary/30 bg-background text-foreground" onClick={() => (window.location.href = getLoginUrl())}>
                เข้าสู่ระบบทีมงาน
              </Button>
            )}
            <Button asChild className="shadow-lg shadow-primary/20">
              <a href={registrationUrl} target="_blank" rel="noreferrer">
                สมัครใช้งานทันที
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.16),_transparent_28%),linear-gradient(180deg,rgba(12,25,52,1)_0%,rgba(7,12,24,1)_100%)] text-white">
          <div className="container grid gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-white/80">
                <Sparkles className="h-4 w-4 text-amber-300" />
                ระบบหาลูกค้า สมัครเล่น และติดตามผลในแพลตฟอร์มเดียว
              </div>
              <div className="space-y-5">
                <p className="max-w-xl text-sm uppercase tracking-[0.24em] text-amber-300">Conversion-first landing experience</p>
                <h2 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                  รับลูกค้าใหม่ให้เร็วขึ้น พร้อมคัด <span className="text-amber-300">ผู้เล่นมูลค่าสูง</span> เข้าสู่ CRM อย่างเป็นระบบ
                </h2>
                <p className="max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
                  หน้า Landing Page นี้ถูกออกแบบเพื่อเชื่อมโฆษณา การสมัคร การเก็บ UTM การวัดผลแคมเปญ และการดูแลลูกค้าปลาวาฬเข้าด้วยกัน โดยใช้แบรนด์ CHOKMA โทนน้ำเงิน-ทองอย่างสม่ำเสมอ และเน้นกลุ่มเป้าหมายที่ชอบเดิมพันหวย มีศักยภาพสร้างรายได้สูง และตอบสนองต่อข้อเสนอชัดเจนอย่างหวย 4 ตัว 7,000 บาท กับ 3 ตัว 1,200 บาท
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                  <p className="text-3xl font-semibold text-amber-300">3%</p>
                  <p className="mt-2 text-sm text-white/72">ค่าคอมแนะนำเพื่อนสูงสุด สำหรับแผน affiliate และ referral engine</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                  <p className="text-3xl font-semibold text-amber-300">7,000</p>
                  <p className="mt-2 text-sm text-white/72">ข้อเสนอหวยหลักของแบรนด์ CHOKMA โดยใช้ข้อความ 4 ตัว 7,000 บาท และ 3 ตัว 1,200 บาท เป็น hook หลักในงานโฆษณา</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                  <p className="text-3xl font-semibold text-amber-300">100K</p>
                  <p className="mt-2 text-sm text-white/72">มูลค่าเครดิตฟรีรวมที่ใช้เป็น hook เพื่อเร่ง conversion ในหน้าแรก</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 rounded-full bg-amber-400 px-7 text-slate-950 hover:bg-amber-300">
                  <a href={registrationUrl} target="_blank" rel="noreferrer">
                    ไปยังหน้าสมัครหลัก <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/20 bg-white/5 px-7 text-white hover:bg-white/10 hover:text-white">
                  <a href="#lead-form">ส่งข้อมูลให้ทีมติดต่อกลับ</a>
                </Button>
              </div>
            </div>

            <Card className="border-white/10 bg-white/8 text-white shadow-2xl backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl">จุดแข็งของข้อเสนอ</CardTitle>
                <CardDescription className="text-white/65">
                  หน้าเดียวที่ใช้เป็นทั้ง conversion surface, data capture layer และประตูเข้าสู่ระบบ CRM หลังบ้าน โดยยึดกฎแบรนด์ CHOKMA เท่านั้นในทุก asset และข้อความหลัก
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {uspCards.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-amber-300/15 p-2 text-amber-300">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-white/70">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-50">
                  ระบบนี้พร้อมต่อยอดไปสู่ dashboard ที่วัด lead จริง, deposit จริง, ROI ต่อแคมเปญ และ actual versus result ของงานที่ AI หรือทีมปฏิบัติการดำเนินไปแล้ว โดยไม่ใช้การปลอมหน้าเพื่อหลบการตรวจจับ แต่ใช้การตรวจคุณภาพทราฟฟิกแบบตรวจสอบได้แทน
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container py-14 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Trust and conversion architecture</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">ออกแบบเพื่อให้โฆษณาไม่หยุดแค่คลิก แต่ไหลต่อไปเป็นข้อมูลเชิงธุรกิจ</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              นอกจากการนำเสนอโปรโมชัน ระบบนี้ยังวางโครงสร้างข้อมูลสำหรับทีมการตลาดและ CRM โดยตรง ทำให้ทุกคลิกและทุกฟอร์มไม่สูญหาย แต่ถูกแปลงเป็นโอกาสในการติดตามลูกค้า วัดผลแคมเปญ และวิเคราะห์คุณภาพทราฟฟิกได้ทันที
            </p>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            {trustPoints.map((point, index) => (
              <Card key={point} className="border-border/70 bg-card/80 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">{point}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-border/60 bg-muted/35">
          <div className="container grid gap-6 py-14 lg:grid-cols-3 lg:py-18">
            <Card className="border-primary/10 bg-card/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl"><CircleDollarSign className="h-5 w-5 text-primary" /> เส้นทางรายได้ที่วัดผลได้</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">
                ผู้เข้าชมสามารถไปยังหน้าสมัครตรงหรือกรอกฟอร์มให้ทีมติดตามต่อ ขณะที่ระบบเก็บ source และ intent เพื่อเชื่อมกับ CPA, conversion rate และ ROI ในแดชบอร์ดได้ทันที
              </CardContent>
            </Card>
            <Card className="border-primary/10 bg-card/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl"><ShieldCheck className="h-5 w-5 text-primary" /> ความน่าเชื่อถือและการดูแลต่อเนื่อง</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">
                ส่วน trust element ช่วยให้หน้าไม่ดูเป็นเพียงป้ายโปรโมชั่น แต่เป็นระบบที่พร้อมดูแลต่อผ่าน CRM, VIP notes, deposit tracking และการจัดลำดับ follow-up ตามมูลค่าลูกค้า
              </CardContent>
            </Card>
            <Card className="border-primary/10 bg-card/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl"><BarChart3 className="h-5 w-5 text-primary" /> AI operations พร้อม actual vs result</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">
                ระบบหลังบ้านถูกออกแบบให้สามารถเก็บ planned actions และผลลัพธ์จริง เพื่อใช้เปรียบเทียบสิ่งที่ AI หรือทีมงานดำเนินไปแล้วกับตัวเลขที่เกิดขึ้นจริงในภาคสนาม
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="lead-form" className="container grid gap-8 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Lead capture</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">ส่งข้อมูลให้ทีมคัดกรองและติดตามใน CRM ได้ทันที</h2>
            <p className="text-base leading-7 text-muted-foreground">
              ฟอร์มนี้ไม่ใช่เพียงการเก็บชื่อ แต่เป็นชั้นรับข้อมูลที่บันทึก UTM, referrer และสัญญาณคุณภาพเบื้องต้น เพื่อให้ทีมงานรู้ว่าลีดนี้มาจากไหน ควรจัดอยู่ใน segment ไหน และควรติดตามด้วยวิธีใดต่อ
            </p>
            <div className="space-y-3 rounded-3xl border border-primary/10 bg-primary/5 p-6">
              <div className="flex items-start gap-3">
                <Wallet className="mt-1 h-5 w-5 text-primary" />
                <p className="text-sm leading-6 text-muted-foreground">รองรับการเก็บข้อมูลสำหรับผู้เล่นที่ต้องการความเร็วในการสมัคร ความชัดเจนของข้อเสนอ และการติดตามโดยทีมเฉพาะทาง</p>
              </div>
              <div className="flex items-start gap-3">
                <Crown className="mt-1 h-5 w-5 text-primary" />
                <p className="text-sm leading-6 text-muted-foreground">ลีดที่มี intent สูงจะถูกตั้งต้นคะแนนเป็นกลุ่มศักยภาพสูงเพื่อให้ทีม CRM เห็นก่อนและสามารถบันทึก follow-up notes ต่อได้</p>
              </div>
            </div>
          </div>

          <Card className="border-border/70 bg-card shadow-lg">
            <CardHeader>
              <CardTitle>แบบฟอร์มรับลีดพร้อมติดตามแคมเปญ</CardTitle>
              <CardDescription>กรอกข้อมูลสั้น ๆ เพื่อให้ระบบบันทึก lead พร้อมแหล่งที่มาของแคมเปญโดยอัตโนมัติ</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">ชื่อที่ใช้ติดต่อ</Label>
                    <Input id="fullName" value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} placeholder="ชื่อหรือนามแฝง" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">เบอร์โทรหรือช่องทางหลัก</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="เบอร์โทรศัพท์" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lineId">LINE ID</Label>
                  <Input id="lineId" value={form.lineId} onChange={(e) => setForm((prev) => ({ ...prev, lineId: e.target.value }))} placeholder="Line ID สำหรับติดต่อกลับ" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">ความสนใจหรือความต้องการ</Label>
                  <Textarea id="notes" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="เช่น สนใจหวยรัฐบาล โปรโมชั่นเครดิตฟรี หรือระบบแนะนำเพื่อน" className="min-h-28" />
                </div>

                <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
                  ระบบจะบันทึกข้อมูลแคมเปญให้อัตโนมัติ เช่น <span className="font-medium text-foreground">utm_source</span>, <span className="font-medium text-foreground">utm_medium</span>, referrer และชนิดอุปกรณ์ เพื่อใช้ต่อใน dashboard และ CRM
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="submit" className="h-11 flex-1" disabled={submitLead.isPending}>
                    {submitLead.isPending ? "กำลังบันทึก lead..." : "บันทึก lead เข้าระบบ"}
                  </Button>
                  <Button asChild type="button" variant="outline" className="h-11 flex-1 border-primary/20">
                    <a href={registrationUrl} target="_blank" rel="noreferrer">
                      ไปหน้าสมัครหลักทันที
                    </a>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="container py-4 pb-28 lg:pb-16">
          <div className="grid gap-4 lg:grid-cols-3">
            {faqItems.map((item) => (
              <Card key={item.q} className="h-full border-border/70 bg-card/90">
                <CardHeader>
                  <CardTitle className="text-lg">{item.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-muted-foreground">{item.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/95 p-3 shadow-2xl backdrop-blur lg:hidden">
        <div className="container flex items-center gap-3">
          <Button asChild className="h-11 flex-1 rounded-full shadow-lg shadow-primary/20">
            <a href={registrationUrl} target="_blank" rel="noreferrer">
              สมัครใช้งานทันที
            </a>
          </Button>
          <Button asChild variant="outline" className="h-11 flex-1 rounded-full border-primary/20 bg-background">
            <a href="#lead-form">ส่งข้อมูลให้ทีมติดต่อ</a>
          </Button>
        </div>
      </div>

      {user ? (
        <div className="fixed bottom-20 right-4 hidden rounded-full border border-primary/15 bg-card px-4 py-2 text-sm text-muted-foreground shadow-lg lg:block">
          เข้าสู่ระบบแล้วในชื่อ <span className="font-medium text-foreground">{user.name || "ทีมงาน"}</span>
        </div>
      ) : null}
    </div>
  );
}
