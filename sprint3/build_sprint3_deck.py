#!/usr/bin/env python3
"""Builds sprint3/P05_Sprint_3_Presentation.pptx directly from the course template.

Preserves all 7 slides, layouts, master theme, and widescreen dimensions (13.33" x 7.5"),
replaces all placeholder text/typos, embeds verified Sprint 3 app screenshots, avoids any
box overlaps, and populates speaker notes on every slide.
"""
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

REPO = Path(__file__).resolve().parent.parent
TEMPLATE = Path("/Users/tatsunamisora/.t3/userdata/attachments/edb75a73-8e96-46ad-ac4e-4e0b42531660-28f3ef56-c9de-4748-9f52-ea052a8c39c5-pptx.pptx")
OUT_PPTX = Path(__file__).resolve().parent / "P05_Sprint_3_Presentation.pptx"
SHOTS = REPO / "screenshots" / "sprint3"

NAVY = RGBColor(0x0B, 0x2C, 0x4A)
TEAL = RGBColor(0x0F, 0x76, 0x6E)
DEEP_TEAL = RGBColor(0x0E, 0x3B, 0x43)
AMBER = RGBColor(0xF2, 0xB1, 0x34)
CREAM = RGBColor(0xF6, 0xF4, 0xEE)
SOFT_TEAL = RGBColor(0xEE, 0xF3, 0xF4)
SOFT_MINT = RGBColor(0xE3, 0xEC, 0xC9)
SOFT_WARN = RGBColor(0xF6, 0xF0, 0xC2)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
INK = RGBColor(0x1F, 0x29, 0x33)
MUTED = RGBColor(0x4B, 0x55, 0x63)
LIGHT_BLUE = RGBColor(0xDC, 0xE8, 0xF5)


def set_notes(slide, text):
    notes = slide.notes_slide
    tf = notes.notes_text_frame
    tf.clear()
    tf.text = text.strip()


def style_box(shape, fill=None, line=None, line_pt=1.25, margins=(0.18, 0.14, 0.18, 0.14)):
    if fill is not None:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill
    if line is not None:
        shape.line.color.rgb = line
        shape.line.width = Pt(line_pt)
    tf = shape.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(margins[0])
    tf.margin_top = Inches(margins[1])
    tf.margin_right = Inches(margins[2])
    tf.margin_bottom = Inches(margins[3])
    tf.vertical_anchor = MSO_ANCHOR.TOP


def add_para(tf, text="", first=False, size=16, bold=False, color=INK, font="Calibri", space_before=0, space_after=6, align=PP_ALIGN.LEFT):
    p = tf.paragraphs[0] if first else tf.add_paragraph()
    p.alignment = align
    p.space_before = Pt(space_before)
    p.space_after = Pt(space_after)
    if text:
        r = p.add_run()
        r.text = text
        r.font.name = font
        r.font.size = Pt(size)
        r.font.bold = bold
        r.font.color.rgb = color
    return p


def add_bullet_rich(tf, prefix, body, first=False, size=16, prefix_color=NAVY, body_color=INK, space_after=8):
    p = tf.paragraphs[0] if first else tf.add_paragraph()
    p.space_before = Pt(0)
    p.space_after = Pt(space_after)
    r1 = p.add_run()
    r1.text = "• " + prefix + ": "
    r1.font.name = "Calibri"
    r1.font.size = Pt(size)
    r1.font.bold = True
    r1.font.color.rgb = prefix_color
    r2 = p.add_run()
    r2.text = body
    r2.font.name = "Calibri"
    r2.font.size = Pt(size)
    r2.font.bold = False
    r2.font.color.rgb = body_color
    return p


def build():
    prs = Presentation(str(TEMPLATE))

    # =========================================================================
    # SLIDE 1 — Cover (TITLE PAGE 01: dark navy bg, white text)
    # =========================================================================
    s1 = prs.slides[0]
    t1 = s1.shapes[0]
    t1.left, t1.top, t1.width, t1.height = Inches(1.15), Inches(2.20), Inches(11.2), Inches(2.35)
    tf1 = t1.text_frame
    tf1.clear()
    tf1.word_wrap = True
    add_para(tf1, "Co-op Internship Project", first=True, size=50, bold=True, color=WHITE, font="Cambria", space_after=8)
    add_para(tf1, "P05 · AI-Assisted Opportunity Matching & Policy Assistant", size=24, bold=True, color=AMBER, font="Calibri", space_before=6, space_after=0)

    d1 = s1.shapes[1]
    d1.left, d1.top, d1.width, d1.height = Inches(1.15), Inches(4.75), Inches(11.2), Inches(1.75)
    tfd1 = d1.text_frame
    tfd1.clear()
    tfd1.word_wrap = True
    add_para(tfd1, "BUS2010 · Sprint 3 Review · Team 5 (P05)", first=True, size=20, bold=True, color=WHITE, space_after=6)
    add_para(tfd1, "Alghala Almansoori · Maha Abdulla · Che Liu · Leonard Jiang Mingming · Yonghan Yang", size=16, bold=False, color=LIGHT_BLUE, space_after=6)
    add_para(tfd1, "23 November 2026", size=15, bold=True, color=AMBER, space_after=0)

    set_notes(s1, """MAHA — Slide 1 (Cover)
Hello everyone, and welcome to Team 5's Sprint 3 Review for P05: AI-Assisted Opportunity Matching and Policy Assistant.
In Sprint 1 we built a deterministic walking skeleton; in Sprint 2 we integrated the shared synthetic Supabase database and pretrained Supabase/gte-small semantic matching; and in Sprint 3 we focused on Integration Readiness: delivering a zero-localhost grounded FAQ Chatbot, fixing and retesting the Sprint 2 AI synonym failures, and giving the portal a unified MBZUAI IPP interface with an end-to-end simulated partner workflow.""")

    # =========================================================================
    # SLIDE 2 — Tools Used By Your Team / Technology Stack
    # =========================================================================
    s2 = prs.slides[1]
    tb1, tb2, tb3 = s2.shapes[0], s2.shapes[1], s2.shapes[2]
    tb1.left, tb1.top, tb1.width, tb1.height = Inches(0.70), Inches(0.45), Inches(11.8), Inches(0.68)
    tf = tb1.text_frame
    tf.clear()
    add_para(tf, "Tools Used By Your Team", first=True, size=34, bold=True, color=NAVY, font="Cambria", space_after=0)

    tb2.left, tb2.top, tb2.width, tb2.height = Inches(0.70), Inches(1.18), Inches(11.8), Inches(0.45)
    tf2 = tb2.text_frame
    tf2.clear()
    add_para(tf2, "Technology Stack · Team 5 (P05)", first=True, size=18, bold=True, color=TEAL, space_after=0)

    tb3.left, tb3.top, tb3.width, tb3.height = Inches(0.70), Inches(1.85), Inches(11.9), Inches(5.05)
    style_box(tb3, fill=WHITE, line=TEAL, line_pt=1.0, margins=(0.30, 0.25, 0.30, 0.25))
    tf3 = tb3.text_frame
    tf3.clear()
    add_bullet_rich(tf3, "Task & SoS Coordination", "Microsoft Teams for sprint planning and Scrum-of-Scrums tracking; WhatsApp for rapid daily team coordination.", first=True, size=17, space_after=14)
    add_bullet_rich(tf3, "Documentation & Governance", "Google Drive/Docs plus versioned Markdown engineering specs (AI_METHOD.md, SUPABASE_GUIDE.md, CHATBOT_SPEC.md, Quick Test Pack).", size=17, space_after=14)
    add_bullet_rich(tf3, "Unified Web Portal", "Evolved from Lovable prototype to a Claude-assisted, self-contained HTML/CSS/JS portal (0 localhost; runs on GitHub Pages or offline index.html).", size=17, space_after=14)
    add_bullet_rich(tf3, "AI & Policy Assistant", "Pretrained Supabase/gte-small sentence embeddings (384-dim) + Supabase Edge Function (ai-suggest) + deterministic grounded FAQ Chatbot (grounded-faq-1.0.0).", size=17, space_after=14)
    add_bullet_rich(tf3, "Shared Backend & Quality", "Shared Supabase PostgreSQL (RLS + per-team write keys), GitHub version control & GitHub Pages hosting, plus 26/26 automated Node & browser checks.", size=17, space_after=0)

    set_notes(s2, """ALGHALA — Slide 2 (Technology Stack)
Here is the technology stack Team 5 used across Sprint 1 to Sprint 3.
For planning and cross-team sync, we use Microsoft Teams and WhatsApp alongside Google Docs and versioned Markdown specifications in GitHub.
For the portal itself, we evolved our early Lovable concept into a self-contained static HTML, CSS, and JavaScript web application—meaning there is zero localhost setup required for demos.
Our AI layer uses the pretrained Supabase/gte-small embedding model via a Supabase Edge Function plus our new client-side grounded IPP Policy Assistant, all backed by our shared Supabase PostgreSQL database with Row-Level Security and GitHub automated testing (26/26 checks passing).""")

    # =========================================================================
    # SLIDE 3 — Key User Stories Completed in Sprint 3
    # =========================================================================
    s3 = prs.slides[2]
    s3_t1, s3_t2, s3_t3 = s3.shapes[0], s3.shapes[1], s3.shapes[2]
    s3_t1.left, s3_t1.top, s3_t1.width, s3_t1.height = Inches(0.70), Inches(0.45), Inches(11.8), Inches(0.68)
    tf = s3_t1.text_frame
    tf.clear()
    add_para(tf, "Key User Stories Completed in Sprint 3", first=True, size=34, bold=True, color=NAVY, font="Cambria", space_after=0)

    s3_t2.left, s3_t2.top, s3_t2.width, s3_t2.height = Inches(0.70), Inches(1.18), Inches(11.8), Inches(0.45)
    tf = s3_t2.text_frame
    tf.clear()
    add_para(tf, "Team 5 (P05) · 26/26 Automated Checks Passing (Synthetic Data)", first=True, size=18, bold=True, color=TEAL, space_after=0)

    # Clear placeholder US 1 / US 2 / US 3 box and park it cleanly without visible text
    s3_t3.text_frame.clear()
    s3_t3.left, s3_t3.top, s3_t3.width, s3_t3.height = Inches(0.70), Inches(1.75), Inches(0.1), Inches(0.1)

    us_cards = [
        (
            "US 1 · Grounded IPP Policy FAQ Assistant (Zero Localhost)",
            "PASS · 7/7 QA AUDIT",
            SOFT_MINT,
            "As a student, I want to ask internship policy questions inside the IPP portal and be told when human approval is required, without invented rules.",
            "Delivered: 8 approved FAQ articles (FAQ-01..08) with policy section citations, pre-retrieval waiver/GPA/visa refusal guard, Coordinator escalation queue, and iframe embed plan (Tests C1–C3 pass)."
        ),
        (
            "US 2 · AI Synonym Failure Fix & Retest (ai-embed-1.1.0)",
            "PASS · REAL GTE-SMALL",
            SOFT_MINT,
            "As a coordinator, I want free-text phrases like \"customer journey mapping\" and \"kanban ticket triage\" mapped accurately with zero eligibility side effects.",
            "Delivered: Added SK-UX-01 & SK-JIRA-01 synonyms; re-ran Supabase/gte-small: \"customer journey mapping\" moved Healthcare (0.8558) -> #1 UX Research (0.8827); \"kanban ticket triage\" rose 0.8062 -> 0.8590; 0/36 eligibility diff (Test A4 pass)."
        ),
        (
            "US 3 · Unified IPP Portal & End-to-End Placement Loop",
            "DEMO READY · SIMULATED PARTNERS",
            SOFT_WARN,
            "As a student, employer, and professor, we want a unified IPP shell showing matching, skill gaps, employer comments, progress logs, and human grading.",
            "Delivered: Unified MBZUAI IPP masthead + P01–P07 ribbon and simulated P02/P06/P07 forms (Test E2 pass). Honestly pending: live partner-team DB hookups, 3 non-builder peer tests, and 20+ external coordinator labels (worksheets ready)."
        )
    ]

    for idx, (title, badge, badge_bg, story, outcome) in enumerate(us_cards):
        top = Inches(1.80 + idx * 1.78)
        card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.70), top, Inches(11.95), Inches(1.60))
        card.adjustments[0] = 0.06
        style_box(card, fill=WHITE, line=TEAL, line_pt=1.25, margins=(0.24, 0.14, 0.24, 0.12))
        ctf = card.text_frame
        add_para(ctf, title + "   [" + badge + "]", first=True, size=16, bold=True, color=NAVY, space_after=4)
        add_para(ctf, story, size=13.5, bold=False, color=MUTED, space_after=4)
        add_para(ctf, outcome, size=13.5, bold=False, color=INK, space_after=0)

    set_notes(s3, """YONGHAN — Slide 3 (Key User Stories Completed in Sprint 3)
We completed three core user stories in Sprint 3, expanding our test suite from 21 to 26 passing checks.
US 1 delivers our grounded IPP Policy Assistant: it answers eight approved internship policy questions with exact citations, explicitly refuses waiver, GPA, visa, or stipend queries without inventing policy, and runs entirely in the browser with zero localhost.
US 2 closes our Sprint 2 AI failure: we updated synonyms for UX Research and Jira and recomputed real Supabase/gte-small embeddings. "Customer journey mapping" jumped from a wrong Healthcare match (0.8558) to #1 UX Research (0.8827), and "kanban ticket triage" rose from 0.8062 to 0.8590—all with zero eligibility changes across 36 pairs.
US 3 delivers the unified IPP portal shell and an end-to-end simulated partner loop covering employer comments, student progress reports, and faculty grading, while transparently noting that live cross-team connections and external peer/coordinator testing remain open with ready-to-use worksheets.""")

    # =========================================================================
    # SLIDE 4 — Project Demo (TITLE PAGE 02: warm gold bg, dark navy text)
    # =========================================================================
    s4 = prs.slides[3]
    s4_t, s4_d, s4_b = s4.shapes[0], s4.shapes[1], s4.shapes[2]
    s4_t.left, s4_t.top, s4_t.width, s4_t.height = Inches(0.55), Inches(1.22), Inches(12.2), Inches(0.75)
    tf = s4_t.text_frame
    tf.clear()
    add_para(tf, "Project Demo — Live P05 & IPP Assistant", first=True, size=34, bold=True, color=NAVY, font="Cambria", space_after=0)

    s4_d.left, s4_d.top, s4_d.width, s4_d.height = Inches(0.43), Inches(6.88), Inches(4.5), Inches(0.25)
    tfd = s4_d.text_frame
    tfd.clear()
    add_para(tfd, "BUS 2010 · Team 5 (P05)", first=True, size=12, bold=True, color=NAVY, font="Calibri", space_after=0)

    s4_b.left, s4_b.top, s4_b.width, s4_b.height = Inches(0.55), Inches(2.12), Inches(5.45), Inches(4.55)
    style_box(s4_b, fill=CREAM, line=NAVY, line_pt=1.25, margins=(0.24, 0.20, 0.24, 0.20))
    tfb = s4_b.text_frame
    tfb.clear()
    add_para(tfb, "Live Access (Zero Localhost)", first=True, size=16, bold=True, color=TEAL, space_after=4)
    add_para(tfb, "• Web Portal: GitHub Pages (public repo link to be confirmed) + standalone index.html offline backup\n• Baseline Demo: https://thecyper.github.io/bus2010-p05-opportunity-matcher/", size=12.5, color=INK, space_after=10)
    add_para(tfb, "4-Step End-to-End Demo Journey", size=16, bold=True, color=TEAL, space_after=4)
    add_bullet_rich(tfb, "1. Ask IPP Assistant", "Ask how matching works (FAQ-01) and test waiver refusal guard (refused + human escalation).", size=13, space_after=6)
    add_bullet_rich(tfb, "2. View Top 3 Matches", "Layla (COOP-B001): rules decide eligibility; gte-small only reorders interest fit.", size=13, space_after=6)
    add_bullet_rich(tfb, "3. Partner Loop", "Send Jira gap -> verify (P06) -> add employer comment, progress log & human grade.", size=13, space_after=6)
    add_bullet_rich(tfb, "4. Coordinator Audit", "Show Before/After ai-embed-1.1.0 synonym fix and 26/26 automated checks.", size=13, space_after=0)

    s4.shapes.add_picture(str(SHOTS / "02-chatbot-grounded-refusal.png"), Inches(6.20), Inches(2.12), width=Inches(6.60))
    cap4 = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.20), Inches(6.30), Inches(6.60), Inches(0.42))
    cap4.adjustments[0] = 0.2
    style_box(cap4, fill=CREAM, line=NAVY, line_pt=0.75, margins=(0.12, 0.05, 0.12, 0.05))
    add_para(cap4.text_frame, "Live view: Grounded FAQ-01 answer with source citation + Refusal Guard blocking skill waiver", first=True, size=11.5, bold=True, color=NAVY, align=PP_ALIGN.CENTER, space_after=0)

    set_notes(s4, """CHE LIU — Slide 4 (Project Demo)
Now let's walk through the live application. Everything runs as a static web portal—meaning zero localhost setup, works on GitHub Pages, and has an identical offline index.html fallback.
Our 4-step demo directly answers the Sprint 3 integration prompt:
First, in IPP Assistant, a student asks how matching works and gets a cited FAQ-01 policy answer; when tested with a waiver bypass prompt, the guard explicitly refuses and routes to human staff.
Second, in My matches for Layla, we show her Top 3 ranked opportunities with clear reasons and why Jira is marked "One thing to do".
Third, in Partner teams, we send Jira to P06 skills training, record verified evidence, then demonstrate the simulated employer comment, student progress report, and human-signed professor grade, before refreshing Layla's matches.
Fourth, in Coordinator and Quality checks, we inspect the real Before/After synonym fix and 26/26 passing checks.""")

    # =========================================================================
    # SLIDE 5 — Showcase Your MVP Component (Professor Request: Unified UI)
    # =========================================================================
    s5 = prs.slides[4]
    s5_t1, s5_t2, s5_t3 = s5.shapes[0], s5.shapes[1], s5.shapes[2]
    s5_t1.left, s5_t1.top, s5_t1.width, s5_t1.height = Inches(0.70), Inches(0.42), Inches(11.9), Inches(0.65)
    tf = s5_t1.text_frame
    tf.clear()
    add_para(tf, "Project Demo — Unified IPP Portal", first=True, size=34, bold=True, color=NAVY, font="Cambria", space_after=0)

    s5_t2.left, s5_t2.top, s5_t2.width, s5_t2.height = Inches(0.70), Inches(1.12), Inches(11.9), Inches(0.42)
    tf = s5_t2.text_frame
    tf.clear()
    add_para(tf, "Showcase Your MVP Component · Addressing Professor Request for a Unified Look", first=True, size=17, bold=True, color=TEAL, space_after=0)

    # Clear placeholder "Professor Request / Please make your app look unified...."
    s5_t3.text_frame.clear()
    s5_t3.left, s5_t3.top, s5_t3.width, s5_t3.height = Inches(0.65), Inches(5.92), Inches(12.00), Inches(1.18)
    style_box(s5_t3, fill=WHITE, line=TEAL, line_pt=1.25, margins=(0.22, 0.12, 0.22, 0.12))
    tf5 = s5_t3.text_frame
    add_bullet_rich(tf5, "1. Unified Navigation & Branding", "Consistent MBZUAI deep-teal header, 6-module IPP ribbon (P01–P07), global Assistant drawer, and light/dark accessibility.", first=True, size=13.5, space_after=4)
    add_bullet_rich(tf5, "2. Single Source of Truth", "Reads the shared Supabase PostgreSQL schema (44 skills, COOP-* students, OP-* listings) rather than isolated schemas.", size=13.5, space_after=4)
    add_bullet_rich(tf5, "3. Honest Simulation Boundaries", "Clearly tags Live P05 modules vs Simulated Partner workflows (employer comments, progress logs, human faculty grading).", size=13.5, space_after=0)

    s5.shapes.add_picture(str(SHOTS / "01-unified-matches.png"), Inches(0.65), Inches(1.70), width=Inches(5.85))
    s5.shapes.add_picture(str(SHOTS / "04-end-to-end-partners.png"), Inches(6.80), Inches(1.70), width=Inches(5.85))

    c5_l = s5.shapes.add_textbox(Inches(0.65), Inches(5.40), Inches(5.85), Inches(0.40))
    add_para(c5_l.text_frame, "Unified IPP Masthead + P01–P07 Ribbon + Layla Top 3 Matches", first=True, size=12, bold=True, color=NAVY, align=PP_ALIGN.CENTER, space_after=0)
    c5_r = s5.shapes.add_textbox(Inches(6.80), Inches(5.40), Inches(5.85), Inches(0.40))
    add_para(c5_r.text_frame, "End-to-End Simulated Partner Loop (Employer Comment, Progress Log & Grade)", first=True, size=12, bold=True, color=NAVY, align=PP_ALIGN.CENTER, space_after=0)

    set_notes(s5, """MAHA / CHE LIU — Slide 5 (Showcase Your MVP Component — Unified Look)
In response to the professor's request to make our application look unified across the platform, we redesigned the portal shell around a cohesive MBZUAI Co-op Platform identity.
On the left, every screen shares one unified deep-teal header, a clickable 6-module journey ribbon from P01 to P07, and a persistent "Ask IPP Assistant" button.
On the right, our Partner teams workspace demonstrates the full placement lifecycle—employer comments, student progress reports, and professor grading—following the exact shared Supabase schema.
Crucially, every ribbon badge and banner distinguishes honestly between Live P05 features and locally simulated partner steps until other teams connect.""")

    # =========================================================================
    # SLIDE 6 — Retrospective: SoS Liaison & Team (TITLE PAGE 02: warm gold bg)
    # =========================================================================
    s6 = prs.slides[5]
    s6_t, s6_d, s6_b = s6.shapes[0], s6.shapes[1], s6.shapes[2]
    s6_t.left, s6_t.top, s6_t.width, s6_t.height = Inches(0.55), Inches(1.22), Inches(12.2), Inches(0.75)
    tf = s6_t.text_frame
    tf.clear()
    add_para(tf, "Retrospective: SoS Liaison & Team", first=True, size=34, bold=True, color=NAVY, font="Cambria", space_after=0)

    s6_d.left, s6_d.top, s6_d.width, s6_d.height = Inches(0.43), Inches(6.88), Inches(4.5), Inches(0.25)
    tfd = s6_d.text_frame
    tfd.clear()
    add_para(tfd, "BUS 2010 · Team 5 (P05)", first=True, size=12, bold=True, color=NAVY, font="Calibri", space_after=0)

    # Left card: Cross-team communication issues (reuse s6_b)
    s6_b.left, s6_b.top, s6_b.width, s6_b.height = Inches(0.55), Inches(2.18), Inches(5.90), Inches(4.40)
    style_box(s6_b, fill=CREAM, line=NAVY, line_pt=1.25, margins=(0.26, 0.22, 0.26, 0.22))
    tfl = s6_b.text_frame
    tfl.clear()
    add_para(tfl, "Cross-Team Communication Challenges", first=True, size=18, bold=True, color=TEAL, space_after=10)
    add_bullet_rich(tfl, "No Unified Class UI Spec", "Each team developed separately in Lovable/local tools without a shared layout template until Sprint 3 feedback.", size=14, space_after=10)
    add_bullet_rich(tfl, "Delayed Partner Integration", "P05 published the shared Supabase DB and SUPABASE_GUIDE.md on 16 Nov, but partner teams have not yet connected live writes.", size=14, space_after=10)
    add_bullet_rich(tfl, "FAQ Chatbot Ambiguity", "Ownership of the Lab 4 FAQ Chatbot remained unresolved in SoS during Sprint 2; Team 5 resolved it by shipping an embeddable 0-localhost assistant.", size=14, space_after=0)

    # Right card: Team learnings & next steps
    r6 = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.85), Inches(2.18), Inches(5.90), Inches(4.40))
    r6.adjustments[0] = 0.04
    style_box(r6, fill=CREAM, line=NAVY, line_pt=1.25, margins=(0.26, 0.22, 0.26, 0.22))
    tfr = r6.text_frame
    add_para(tfr, "Team Learnings & Next Steps (Dean Demo)", first=True, size=18, bold=True, color=TEAL, space_after=10)
    add_bullet_rich(tfr, "Self-Contained Beats Fragile", "Static browser execution + offline index.html + precomputed embeddings eliminates localhost/network demo failures.", size=14, space_after=10)
    add_bullet_rich(tfr, "Honesty & Guardrails Build Trust", "Refusal guards + separating rules from AI + explicit simulation tags keep claims defensible before faculty.", size=14, space_after=10)
    add_bullet_rich(tfr, "Ready for Independent Validation", "Prepared a 5-min Quick Test Pack (3 peer testers + 20 synthetic pairs COOP-B007..B016) to collect real external labels before Dean Hao Li's demo.", size=14, space_after=0)

    set_notes(s6, """LEONARD — Slide 6 (Retrospective: SoS Liaison & Team)
Reflecting honestly on Scrum-of-Scrums and cross-team collaboration:
On the challenge side, there was no shared UI template across teams early on, and although Team 5 stood up the shared Supabase database and tested partner guide on 16 November, other teams have not yet connected live writes—and chatbot ownership was ambiguous in Sprint 2.
What we learned is that shipping self-contained, zero-localhost components with a documented iframe embed plan removes integration friction, and keeping strict honesty between live P05 features and simulated partner steps makes our system far more trustworthy.
Before the final demo to Dean Hao Li, our next step is running our Quick Test Pack with three non-builder classmates and an independent coordinator to replace Team 5's provisional stand-in labels.""")

    # =========================================================================
    # SLIDE 7 — Key Impediment From Sprint 2 / Risk & Mitigation
    # =========================================================================
    s7 = prs.slides[6]
    s7_t1, s7_t2, s7_t3, s7_tbl, s7_badge = s7.shapes[0], s7.shapes[1], s7.shapes[2], s7.shapes[3], s7.shapes[4]

    s7_t1.left, s7_t1.top, s7_t1.width, s7_t1.height = Inches(0.70), Inches(0.42), Inches(7.40), Inches(0.65)
    tf = s7_t1.text_frame
    tf.clear()
    add_para(tf, "Key Impediment From Sprint 2", first=True, size=34, bold=True, color=NAVY, font="Cambria", space_after=0)

    s7_t2.left, s7_t2.top, s7_t2.width, s7_t2.height = Inches(0.70), Inches(1.12), Inches(7.40), Inches(0.42)
    tf = s7_t2.text_frame
    tf.clear()
    add_para(tf, "Risk & Mitigation · IMP-S2-01", first=True, size=18, bold=True, color=TEAL, space_after=0)

    # Repurpose TextBox 6 ("Example / How it was resolved") into crisp status badge
    s7_badge.left, s7_badge.top, s7_badge.width, s7_badge.height = Inches(8.25), Inches(0.45), Inches(4.40), Inches(0.95)
    style_box(s7_badge, fill=SOFT_WARN, line=AMBER, line_pt=1.5, margins=(0.18, 0.12, 0.18, 0.12))
    tfb7 = s7_badge.text_frame
    tfb7.clear()
    add_para(tfb7, "Status: Mitigated in P05", first=True, size=15, bold=True, color=NAVY, align=PP_ALIGN.CENTER, space_after=2)
    add_para(tfb7, "Partner Live Adoption Pending", size=13, bold=False, color=MUTED, align=PP_ALIGN.CENTER, space_after=0)

    # Reposition TextBox 3 above the table with zero overlap (y=1.68..2.74, table starts at y=2.90)
    s7_t3.left, s7_t3.top, s7_t3.width, s7_t3.height = Inches(0.70), Inches(1.68), Inches(11.95), Inches(1.06)
    style_box(s7_t3, fill=SOFT_TEAL, line=TEAL, line_pt=1.0, margins=(0.20, 0.12, 0.20, 0.10))
    tfm = s7_t3.text_frame
    tfm.clear()
    add_para(tfm, "ID: IMP-S2-01   |   Detected On: 11 Nov 2026   |   Responsible: Team 5 (P05) & SoS Liaisons", first=True, size=13.5, bold=True, color=NAVY, space_after=4)
    add_para(tfm, "Description: Isolated mock schemas across P01–P07 blocked cross-team reads   |   Status: Mitigated in P05 (Partner Adoption Pending)", size=13, bold=False, color=INK, space_after=4)
    add_para(tfm, "Resolved On: 16 Nov 2026 (Shared Supabase DB & Guide live) · 23 Nov 2026 (Unified IPP Shell & Sandbox Loop)", size=13, bold=True, color=TEAL, space_after=0)

    # Reposition Table 5 cleanly below TextBox 3 (no overlap!)
    s7_tbl.left, s7_tbl.top, s7_tbl.width, s7_tbl.height = Inches(0.70), Inches(2.90), Inches(11.95), Inches(4.15)
    tbl = s7_tbl.table
    tbl.columns[0].width = Inches(2.25)
    tbl.columns[1].width = Inches(9.70)

    rows_data = [
        ("Field", "Sprint 2 Impediment & Team 5 Resolution"),
        ("Description", "Partner modules (P01–P04, P06–P07) used incompatible local mock data structures, field names, and unaligned skill lists, preventing P05 from reading live profiles or writing skill-gap handoffs."),
        ("Impact", "True cross-team integration testing was blocked; P05 could not verify live P01 profile updates or P06 evidence closures from partner apps."),
        ("Owner", "Che Liu & Team 5 (P05 database maintainers) alongside P01–P07 SoS representatives."),
        ("Resolution", "Built shared Supabase PostgreSQL (44 canonical skills, RLS + per-team write keys, sandbox COOP-Z001/OP-999), published tested SUPABASE_GUIDE.md, and added simulated partner flows in P05 so end-to-end verification runs without blockers."),
        ("Escalation", "Raised in Scrum-of-Scrums for team key onboarding and escalated unified UI + FAQ Chatbot scope alignment to BUS2010 instructor.")
    ]
    for r_idx, (c0, c1) in enumerate(rows_data):
        row = tbl.rows[r_idx]
        for c_idx, txt in enumerate((c0, c1)):
            cell = row.cells[c_idx]
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            cell.margin_left = Inches(0.14)
            cell.margin_right = Inches(0.14)
            cell.margin_top = Inches(0.06)
            cell.margin_bottom = Inches(0.06)
            cell.fill.solid()
            cell.fill.fore_color.rgb = DEEP_TEAL if r_idx == 0 else (WHITE if r_idx % 2 == 1 else SOFT_TEAL)
            ctf = cell.text_frame
            ctf.clear()
            ctf.word_wrap = True
            add_para(
                ctf,
                txt,
                first=True,
                size=13.5 if r_idx == 0 else 12.5,
                bold=(r_idx == 0 or c_idx == 0),
                color=WHITE if r_idx == 0 else (NAVY if c_idx == 0 else INK),
                space_after=0
            )

    set_notes(s7, """LEONARD — Slide 7 (Key Impediment From Sprint 2: IMP-S2-01)
Our biggest Sprint 2 impediment, IMP-S2-01, was detected on 11 November: different teams maintained isolated mock schemas and inconsistent skill names, blocking cross-team integration.
To mitigate this without blocking our own delivery, Team 5 stood up a shared Supabase PostgreSQL database with 44 shared skill terms, row-level security, per-team write keys, a dedicated sandbox (COOP-Z001 and OP-999), and a tested partner guide on 16 November—then unified our portal shell and simulated partner workflow by 23 November.
While the architecture and P05 side are resolved and verified, live write adoption by the other teams remains open via Scrum-of-Scrums and instructor coordination. Thank you, and we welcome your questions.""")

    OUT_PPTX.parent.mkdir(parents=True, exist_ok=True)
    prs.save(str(OUT_PPTX))
    print("Saved", OUT_PPTX)


if __name__ == "__main__":
    build()
