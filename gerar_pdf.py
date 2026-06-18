from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER

# ── Cores ─────────────────────────────────────────────────────────────────────
AZUL  = colors.HexColor('#002E6E')
VERDE = colors.HexColor('#72BF45')
CINZA = colors.HexColor('#444444')
AZUL_CLARO = colors.HexColor('#F0F4FB')
BRANCO = colors.white

# ── Estilos ───────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def S(name, **kw):
    base = kw.pop('parent', 'Normal')
    s = ParagraphStyle(name, parent=styles[base], **kw)
    return s

TITULO    = S('Titulo',    fontSize=24, textColor=AZUL,  leading=30, alignment=TA_CENTER, spaceAfter=4)
SUBTITULO = S('Subtitulo', fontSize=13, textColor=VERDE, leading=18, alignment=TA_CENTER, spaceAfter=4, fontName='Helvetica-Bold')
CAPTION   = S('Caption',   fontSize=10, textColor=CINZA, leading=14, alignment=TA_CENTER, spaceAfter=16)

H1 = S('H1', fontSize=18, textColor=AZUL,  leading=24, fontName='Helvetica-Bold', spaceBefore=20, spaceAfter=6)
H2 = S('H2', fontSize=14, textColor=AZUL,  leading=20, fontName='Helvetica-Bold', spaceBefore=14, spaceAfter=4)
H3 = S('H3', fontSize=11, textColor=VERDE, leading=16, fontName='Helvetica-Bold', spaceBefore=8,  spaceAfter=3)

BODY  = S('Body',  fontSize=10.5, textColor=CINZA, leading=15, spaceBefore=2, spaceAfter=4)
SMALL = S('Small', fontSize=9,    textColor=CINZA, leading=13, spaceBefore=2, spaceAfter=3)

BULLET = S('Bul', fontSize=10.5, textColor=CINZA, leading=15,
           leftIndent=14, firstLineIndent=0, spaceBefore=1, spaceAfter=2,
           bulletIndent=4, bulletText='•')

NUM_STYLE = S('Num', fontSize=10.5, textColor=CINZA, leading=15,
              leftIndent=18, spaceBefore=2, spaceAfter=3)

# ── Helpers ───────────────────────────────────────────────────────────────────
def h1(text):
    return [Paragraph(text, H1), HRFlowable(width='100%', thickness=2, color=AZUL, spaceAfter=6)]

def h2(text):
    return [Paragraph(text, H2), HRFlowable(width='100%', thickness=1, color=VERDE, spaceAfter=4)]

def h3(text):   return Paragraph(text, H3)
def body(text): return Paragraph(text, BODY)
def small(text):return Paragraph(text, SMALL)
def sp(n=6):    return Spacer(1, n)

def bullet(text):
    return Paragraph(text, BULLET)

def numbered(n, text):
    return Paragraph(f'<b>{n}.</b> {text}', NUM_STYLE)

def tbl(headers, rows, col_widths):
    data = [headers] + rows
    col_w = [w * cm for w in col_widths]
    t = Table(data, colWidths=col_w, repeatRows=1)
    style = TableStyle([
        # header
        ('BACKGROUND',  (0,0), (-1,0),  AZUL),
        ('TEXTCOLOR',   (0,0), (-1,0),  BRANCO),
        ('FONTNAME',    (0,0), (-1,0),  'Helvetica-Bold'),
        ('FONTSIZE',    (0,0), (-1,0),  9.5),
        ('BOTTOMPADDING',(0,0),(-1,0),  6),
        ('TOPPADDING',  (0,0), (-1,0),  6),
        # body
        ('FONTNAME',    (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE',    (0,1), (-1,-1), 9.5),
        ('TEXTCOLOR',   (0,1), (-1,-1), CINZA),
        ('TOPPADDING',  (0,1), (-1,-1), 5),
        ('BOTTOMPADDING',(0,1),(-1,-1), 5),
        # zebra
        ('BACKGROUND',  (0,1), (-1,-1), BRANCO),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[AZUL_CLARO, BRANCO]),
        # grid
        ('GRID',        (0,0), (-1,-1), 0.4, colors.HexColor('#CCCCCC')),
        ('VALIGN',      (0,0), (-1,-1), 'MIDDLE'),
    ])
    t.setStyle(style)
    return [t, sp(10)]

# ══════════════════════════════════════════════════════════════════════════════
story = []

# ── Capa ──────────────────────────────────────────────────────────────────────
story += [
    sp(40),
    Paragraph('Tráfego Pago — Orcali 2026', TITULO),
    sp(6),
    Paragraph('Para prospecções que não podem parar', SUBTITULO),
    sp(8),
    Paragraph('Planejamento estratégico de mídia paga — Meta Ads + Google Ads<br/>Digitha para Orcali Segurança e Serviços · Junho 2026', CAPTION),
    PageBreak(),
]

# ══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 1 — ANÁLISE
# ══════════════════════════════════════════════════════════════════════════════
story += h1('Análise')

# Objetivos
story += h2('Objetivos de Performance')
story += [
    h3('1. Reconhecimento de marca nos nichos-alvo'),
    body('Construir presença contínua da Orcali junto a decisores B2B em instituições de saúde, ensino e financeiras no PR e SC, antes que eles comecem a pesquisar ativamente por fornecedores.'),
    h3('2. Geração de leads qualificados'),
    body('Atrair gerentes e diretores administrativos com intenção real de contratar serviços de facilities e segurança, com rastreamento de origem desde o primeiro clique.'),
    h3('3. Estrutura de nutrição e acompanhamento'),
    body('Conectar cada lead capturado ao RD Station para rastreamento completo da jornada comercial — do primeiro contato ao fechamento de contrato.'),
    sp(8),
]

# Diagnóstico
story += h2('Diagnóstico — O que aconteceu em 2024')
story += [
    h3('O investimento anterior'),
    body('A Orcali rodou aproximadamente R$ 6.000/mês em tráfego pago ao longo de 2024. O resultado foi descrito internamente como de baixo impacto comercial.'),
    h3('Por que não funcionou'),
    bullet('Sem landing page dedicada — o tráfego ia para o site institucional genérico'),
    bullet('Sem rastreamento de origem — impossível saber qual campanha gerava resultado'),
    bullet('Sem qualificação de lead — qualquer contato era tratado como igual'),
    bullet('Sem integração com CRM — lead chegava por e-mail e se perdia'),
    h3('O que mudamos para 2026'),
]
story += tbl(
    ['Antes', 'Agora'],
    [
        ['Site institucional genérico', 'Landing page dedicada por nicho'],
        ['Sem rastreamento', 'Meta Pixel + CAPI + Google Tag'],
        ['Formulário básico', 'Typebot com qualificação por segmento'],
        ['Lead perdido no e-mail', 'Google Sheets + RD Station integrados'],
        ['Sem atribuição de origem', 'UTM + 38 campos de dados por lead'],
    ],
    [7.5, 7.5]
)

# Análise de canais
story += h2('Análise de Canais — Meta vs Google para B2B')
story += [
    h3('Por que Meta Ads'),
    body('O decisor B2B não levanta a mão facilmente. O Meta constrói reconhecimento antes da decisão de pesquisar — quando o gestor já conhece a Orcali, a busca no Google converte com muito mais facilidade.'),
    bullet('Alcance segmentado por cargo, setor e região'),
    bullet('Retargeting de visitantes da landing page'),
    bullet('Lookalike da base de 2.966 clientes ativos da Orcali'),
    h3('Por que Google Ads'),
    body('70% da jornada B2B é autodidata. Quando o decisor digita no Google, ele já está próximo da decisão — é o momento certo de capturar.'),
    bullet('Captura intenção direta de compra no momento da busca'),
    bullet('Keywords de fundo de funil segmentadas por nicho'),
    bullet('Custo por lead mais alto, mas qualidade significativamente superior'),
    h3('A lógica da combinação'),
    body('Meta constrói familiaridade → Google captura a decisão.'),
]
story += tbl(
    ['', 'Meta Ads', 'Google Search'],
    [
        ['Papel na estratégia', 'Alcance + Retargeting', 'Fundo de funil'],
        ['Temperatura do lead', 'Mais frio', 'Mais quente'],
        ['CPL estimado', 'R$ 50–90', 'R$ 80–150'],
        ['Quando converte', 'Após múltiplos contatos', 'Na busca ativa'],
        ['MQL → SQL', '5–10%', '7–12%'],
    ],
    [5.0, 4.5, 5.5]
)

# Jornada do decisor
story += h2('Jornada do Decisor Online')
story += [
    h3('Como o B2B decide — dados de mercado'),
    bullet('70% da jornada de compra B2B é feita sem contato com vendedor (pesquisa autodidata)'),
    bullet('94% dos decisores já estão informados antes de entrar em contato com uma empresa'),
    bullet('56% usam o Google pelo menos uma vez por semana durante o processo de decisão'),
    bullet('86% já têm fornecedores em mente quando começam a jornada de compra'),
    bullet('43% buscam novos fornecedores quando há insatisfação com o atual'),
    bullet('31% apontam confiança na marca como fator número 1 na contratação B2B'),
    small('Fontes: Think with Google — Jornada de Compra B2B | Pesquisa B2B Brasil 2025'),
    h3('O que isso significa para a Orcali'),
    body('O gestor hospitalar ou diretor escolar não clica no primeiro anúncio e fecha contrato. Ele pesquisa passivamente, compara, volta ao Google semanas depois, visita o site, vê referências — e aí decide. A presença contínua no Meta constrói o terreno para a conversão no Google.'),
    sp(8),
]

# Benchmarket
story += h2('Benchmarket Digital — Concorrentes')
story += [
    h3('Orsegups'),
    bullet('Posicionamento forte em tecnologia e inovação em segurança'),
    bullet('Comunicação agressiva: IA, monitoramento inteligente, plataforma própria, menor tempo de resposta'),
    bullet('Certificações ISO 27001 e ISO 27701'),
    bullet('Escala nacional muito evidente — presença consolidada em busca orgânica'),
    h3('Orbenk'),
    bullet('Campanha institucional ativa em SC — TV, rádio e portais digitais'),
    bullet('Posicionamento: bem-estar, cuidado, transformação, ESG'),
    bullet('Tecnologia como inovação: robôs de limpeza, drones, análise de dados'),
    bullet('420 cidades, 33.000 colaboradores — escala como argumento de credibilidade'),
    h3('Khronos'),
    bullet('Especialização em monitoramento eletrônico'),
    bullet('Comunicação técnica focada em soluções integradas de segurança'),
    h3('Oportunidade para a Orcali'),
    body('Enquanto os concorrentes comunicam escala e tecnologia, a Orcali tem um argumento que eles não têm: 58 anos de continuidade, confiabilidade comprovada e presença regional profunda. Para o decisor B2B que teme trocar de fornecedor e se arrepender, esse é o argumento mais relevante.'),
    sp(8),
]

# Personas
story += h2('Personas no Digital')
story += [
    h3('Mariana Costa — Gerente Administrativa (Saúde, 42 anos)'),
    body('"Preciso garantir um ambiente seguro, limpo e eficiente para que as equipes médicas possam focar no atendimento."'),
    bullet('Busca no Google: empresa facilities hospital SC, terceirização limpeza hospitalar, segurança patrimonial hospital Florianópolis'),
    bullet('Consulta LinkedIn e portais setoriais antes de entrar em contato'),
    bullet('Exige prova de certificações e conformidade regulatória'),
    bullet('Responde diretamente à diretoria executiva — precisa de dados para justificar a escolha'),
    h3('Ricardo Almeida — Diretor Administrativo (Ensino, 42 anos)'),
    body('"Quero que a operação funcione sem interferir na atividade educacional."'),
    bullet('Busca: facilities instituição de ensino, terceirização portaria escola, empresa limpeza universidade'),
    bullet('Pesquisa por cases e referências de outras instituições semelhantes'),
    bullet('Precisa convencer a diretoria — o argumento de custo-benefício é central'),
    h3('Comportamento digital em comum'),
    body('Chegam ao Meta passivamente — são impactados pela Orcali enquanto navegam. Chegam ao Google ativamente — já decidiram pesquisar. A conversão acontece após múltiplos pontos de contato entre as duas plataformas.'),
    PageBreak(),
]

# ══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 2 — ESTRATÉGIA
# ══════════════════════════════════════════════════════════════════════════════
story += h1('Estratégia')

# Nichos + Geo
story += h2('Segmentação — Nichos e Regiões')
story += [h3('Nichos prioritários — fase inicial')]
story += tbl(
    ['Nicho', 'Por que priorizar'],
    [
        ['Instituições financeiras', 'Alto ticket, decisão corporativa, compliance obrigatório'],
        ['Hospitais e clínicas', 'Operação 24h, zero tolerância a falha, exige ISO e certificações'],
        ['Instituições de ensino', 'Múltiplos prédios, gestão complexa, ciclo de renovação previsível'],
    ],
    [5.5, 9.5]
)
story += [
    h3('Regiões de atuação'),
    bullet('Santa Catarina (always-on): Florianópolis, Joinville, Blumenau, Itajaí, Tubarão'),
    bullet('Paraná (expansão ativa): Curitiba, Toledo, Londrina, Guarapuava'),
    body('SC é o mercado base consolidado onde a Orcali já tem presença e pode converter mais rápido. PR é expansão onde o awareness precisa ser construído primeiro.'),
    sp(8),
]

# Estratégia Meta
story += h2('Estratégia Meta Ads')
story += [
    h3('Campanha 1 — Reconhecimento de Marca'),
    bullet('Objetivo de campanha: Alcance / Awareness'),
    bullet('Público A: Lookalike 1% gerado a partir da base de 2.966 clientes ativos da Orcali'),
    bullet('Público B: Cargo (Gerente/Diretor Administrativo) + setor (saúde, educação, financeiro) + geo PR e SC'),
    bullet('Criativos: institucionais, diferenciais da Orcali, cases por nicho, tom consultivo e confiável'),
    h3('Campanha 2 — Retargeting'),
    bullet('Público: visitantes da landing page rastreados pelo Pixel + engajamento no Instagram'),
    bullet('Objetivo de campanha: Geração de Leads / Conversão'),
    bullet('Criativos: prova social por nicho, diferenciais específicos (58 anos, 1.554 clientes, certificações)'),
    bullet('Formato principal: carrossel com argumentos por dor + CTA direto para formulário'),
    h3('Lookalike — base de clientes Orcali'),
    body('A Orcali tem uma base de 2.966 clientes cadastrados com e-mail e telefone. Essa base será carregada no Meta como Custom Audience para gerar um Lookalike 1% — o público mais semelhante aos clientes reais da Orcali dentro das regiões de SC e PR.'),
    sp(8),
]

# Estratégia Google
story += h2('Estratégia Google Ads')
story += [h3('Search — Fundo de funil (prioridade principal)')]
story += tbl(
    ['Grupo de Anúncio', 'Palavras-chave principais'],
    [
        ['Saúde', 'empresa facilities hospital SC, terceirização limpeza hospitalar, segurança patrimonial hospital'],
        ['Educação', 'facilities instituição de ensino, terceirização portaria escola, limpeza universidade SC'],
        ['Financeiro', 'empresa facilities banco, terceirização serviços financeiro, segurança patrimonial Curitiba'],
        ['Geral / Concorrente', 'Orcali facilities, alternativa Orbenk, empresa terceirização SC PR'],
    ],
    [4.0, 11.0]
)
story += [
    h3('Display — Topo de funil'),
    bullet('Remarketing: visitantes da landing page que não converteram no formulário'),
    bullet('Contextual: portais de notícias B2B, sites do setor de saúde e educação'),
    bullet('Criativo: banners com foco em continuidade operacional e confiabilidade'),
    sp(8),
]

# Distribuição de verba
story += h2('Distribuição de Verba — R$ 8.000/mês')
story += tbl(
    ['Canal', 'Verba mensal', 'Participação', 'Objetivo principal'],
    [
        ['Google Ads (Search + Display)', 'R$ 5.500', '69%', 'Leads qualificados — fundo de funil'],
        ['Meta Ads (Alcance + Retargeting)', 'R$ 2.500', '31%', 'Awareness + Retargeting'],
        ['Total', 'R$ 8.000', '100%', '—'],
    ],
    [5.5, 2.5, 2.2, 4.8]
)
story += [
    h3('Racional da distribuição'),
    body('B2B de alto ticket e ciclo de venda longo prioriza intenção de busca. O Google recebe a maior fatia porque o decisor chega com a decisão quase formada. O Meta complementa com presença de marca antes da busca e cobre o retargeting de quem visitou mas não converteu.'),
    body('Referência: alocação padrão B2B 2026 é 46% Google + 8% Meta. Na Orcali, o Meta recebe proporção maior por causa da base lookalike forte e da necessidade de construção de marca regional.'),
    PageBreak(),
]

# ══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 3 — EXECUÇÃO
# ══════════════════════════════════════════════════════════════════════════════
story += h1('Execução')

# LP + Form
story += h2('Landing Page e Formulário')
story += [
    h3('O que foi construído'),
    body('Landing page dedicada ao serviço de Facilities, projetada para conversão — sem o ruído do site institucional. A página usa o posicionamento estratégico da Orcali e direciona o visitante direto para o formulário qualificador.'),
    bullet('URL: site-orcali.vercel.app'),
    bullet('Estrutura: Hero → Diferenciais → Serviços → Prova social → Formulário'),
    bullet('Formulário conversacional via Typebot (chatbot embutido na página)'),
    h3('Campos do formulário'),
    body('Nome · E-mail corporativo · Telefone/WhatsApp · Empresa · Segmento (saúde, ensino, financeiro, outros) · Estado · Cidade · Mensagem'),
    h3('Por que Typebot em vez de formulário estático'),
    bullet('Taxa de conclusão maior — a lógica conversacional reduz abandono'),
    bullet('Qualificação automática por nicho antes de chegar ao comercial'),
    bullet('Captura de UTMs desde o primeiro campo — origem rastreada sem falha'),
    bullet('Integração em tempo real com Google Sheets e Meta CAPI'),
    sp(8),
]

# Tracking
story += h2('Tracking e Integrações')
story += [
    h3('Fluxo completo do lead'),
    numbered(1, 'Usuário clica no anúncio (Meta ou Google) — UTMs registradas automaticamente'),
    numbered(2, 'Landing page carrega — PageView enviado ao Meta CAPI e Google Tag'),
    numbered(3, 'Usuário preenche o Typebot — device, geo, IP, UTMs e dados do form capturados'),
    numbered(4, 'Edge function (Vercel) grava 38 campos no Google Sheets em tempo real'),
    numbered(5, 'Apps Script dispara: evento Lead ao Meta CAPI + lead criado no RD Station'),
    numbered(6, 'Comercial recebe lead com origem completa — campanha, nicho, cidade, dispositivo'),
    h3('O que isso resolve na prática'),
    body('Todo lead chega ao comercial com contexto: veio do Google buscando "facilities hospital SC" ou do retargeting Meta após visitar a página? É gerente de hospital em Florianópolis ou diretor de escola em Curitiba? O comercial aborda com informação, não no escuro.'),
    sp(8),
]

# KPIs
story += h2('KPIs e Metas')
story += tbl(
    ['Indicador', 'Meta mês 1–2', 'Meta mês 4–6'],
    [
        ['CPL Google Ads', '≤ R$ 150', '≤ R$ 100'],
        ['CPL Meta Ads', '≤ R$ 90', '≤ R$ 60'],
        ['Leads qualificados/mês (Google)', '30–40', '50–60'],
        ['Taxa de conversão da landing page', '> 3%', '> 5%'],
        ['Taxa MQL (lead → oportunidade)', '8%', '12%'],
    ],
    [8.0, 3.0, 3.0]
)
story += [
    h3('Referências de mercado'),
    bullet('Google Ads — serviços profissionais B2B Brasil: R$ 40–R$ 180 por lead'),
    bullet('Meta Ads — B2B: taxa de qualificação de 5–10% MQL para SQL'),
    bullet('Google Search — B2B: taxa de qualificação de 7–12% MQL para SQL'),
    bullet('Após 6 meses de otimização contínua: CPL tende a cair 30–50%'),
    h3('Acompanhamento semanal'),
    bullet('Volume de leads por canal e por nicho'),
    bullet('CPL por campanha e por grupo de anúncio'),
    bullet('Qualidade: leads que viraram reunião agendada'),
    bullet('Score de qualidade (Google) e relevância (Meta)'),
    sp(8),
]

# Próximos passos
story += h2('Próximos Passos')
story += [
    h3('Semana 1'),
    numbered(1, 'Finalizar integração RD Station — cliente gera token em app.rdstation.com.br → Configurações → Integrações → Acessos à API'),
    numbered(2, 'Normalizar base de 2.966 clientes e fazer upload no Meta para criar Custom Audience e Lookalike 1%'),
    h3('Semanas 1–2'),
    numbered(3, 'Criar campanhas Meta: Alcance (Lookalike + cargo/setor/geo) + Retargeting (visitantes LP)'),
    numbered(4, 'Criar campanhas Google: grupos por nicho (saúde, ensino, financeiro) + Display remarketing'),
    numbered(5, 'Produzir criativos iniciais — 3 a 4 peças por canal, adaptadas por nicho'),
    h3('Dia 30 — Primeiro relatório'),
    numbered(6, 'Análise de primeiros dados: CPL real por canal, volume de leads, qualidade e ajustes de segmentação'),
    PageBreak(),
]

# Fontes
story += h2('Referências e Fontes')
story += [
    small('Jornada do decisor B2B: Think with Google — thinkwithgoogle.com/intl/pt-br/tendencias-de-consumo/jornada-do-consumidor/b2b-jornada-pesquisa/'),
    small('Benchmarks plataformas B2B: B2B PPC 2025 Report — thedigitalbloom.com'),
    small('Meta B2B ROAS 51% / Google Search ROAS 67% — Lever Digital, 2026'),
    small('CPL Brasil serviços profissionais B2B: witu.digital/quanto-custa-google-ads'),
    small('Concorrentes: grandesnomesdapropaganda.com.br (Orbenk) | gazetamercantil.digital'),
    small('Ad Library Meta — verificar manualmente: ads.facebook.com/ads/library (buscar: Orsegups, Orbenk, Khronos)'),
]

# ── Build ──────────────────────────────────────────────────────────────────────
out = r'C:\Users\igori\projetos\orcali-lp\Orcali-Trafego-2026.pdf'
doc = SimpleDocTemplate(
    out,
    pagesize=A4,
    leftMargin=2.5*cm, rightMargin=2.5*cm,
    topMargin=2.5*cm,  bottomMargin=2.5*cm,
)
doc.build(story)
print(f'Salvo em: {out}')
