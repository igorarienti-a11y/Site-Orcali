(function(){
  "use strict";

  var abertoEm = Date.now();

  /* Fallback do logo caso as imagens ainda não estejam no servidor */
  var logoImg = document.getElementById('logoImg'), logoTxt = document.getElementById('logoTxt');
  if (logoImg) logoImg.addEventListener('error', function(){
    logoImg.style.display = 'none';
    if (logoTxt) logoTxt.style.display = 'block';
  });

  /* Menu mobile */
  var menuBtn = document.getElementById('menuBtn'), navMob = document.getElementById('navMob');
  menuBtn.addEventListener('click', function(){
    var aberto = navMob.classList.toggle('aberto');
    menuBtn.setAttribute('aria-expanded', aberto ? 'true' : 'false');
  });
  navMob.addEventListener('click', function(e){
    if (e.target.tagName === 'A'){ navMob.classList.remove('aberto'); menuBtn.setAttribute('aria-expanded','false'); }
  });

  /* FAQ (acordeão) */
  document.querySelectorAll('.faq-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var aberto = btn.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.faq-btn').forEach(function(b){
        b.setAttribute('aria-expanded','false');
        b.parentElement.nextElementSibling.classList.remove('aberta');
      });
      if (!aberto){
        btn.setAttribute('aria-expanded','true');
        btn.parentElement.nextElementSibling.classList.add('aberta');
      }
    });
  });

  /* Máscaras */
  function mascaraTelefone(v){
    v = v.replace(/\D/g,'').slice(0,11);
    if (v.length <= 10) return v.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, function(_,a,b,c){
      return (a ? '('+a : '') + (a.length===2 ? ') ' : '') + b + (c ? '-'+c : '');
    }).trim();
    return v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  }
  /* CNPJ: desde 31/07/2026 as 12 primeiras posições podem ter letras (IN RFB 2.229/2024).
     Os 2 dígitos verificadores seguem numéricos. */
  function mascaraCnpj(v){
    v = v.toUpperCase().replace(/[^0-9A-Z]/g,'').slice(0,14);
    var base = v.slice(0,12), dv = v.slice(12).replace(/\D/g,'');
    var out = base.slice(0,2);
    if (base.length > 2)  out += '.' + base.slice(2,5);
    if (base.length > 5)  out += '.' + base.slice(5,8);
    if (base.length > 8)  out += '/' + base.slice(8,12);
    if (dv.length)        out += '-' + dv;
    return out;
  }

  /* Módulo 11 com valor de cada caractere = ASCII − 48 (0–9 valem 0–9, A=17 … Z=42).
     A regra é retrocompatível: CNPJ numérico antigo gera o mesmo DV. */
  function cnpjValido(bruto){
    var v = (bruto||'').toUpperCase().replace(/[^0-9A-Z]/g,'');
    if (v.length !== 14) return false;
    if (!/^[0-9A-Z]{12}\d{2}$/.test(v)) return false;
    if (/^(.)\1{13}$/.test(v)) return false;            // 00000000000000 e afins
    function dig(base, pesos){
      var soma = 0;
      for (var i = 0; i < pesos.length; i++) soma += (base.charCodeAt(i) - 48) * pesos[i];
      var r = soma % 11;
      return r < 2 ? 0 : 11 - r;
    }
    var d1 = dig(v.slice(0,12), [5,4,3,2,9,8,7,6,5,4,3,2]);
    var d2 = dig(v.slice(0,13), [6,5,4,3,2,9,8,7,6,5,4,3,2]);
    return d1 === +v[12] && d2 === +v[13];
  }

  var tel = document.getElementById('telefone'), cnpj = document.getElementById('cnpj');
  tel.addEventListener('input', function(){ tel.value = mascaraTelefone(tel.value); });
  var statusCnpj = document.getElementById('statusCnpj'), consultado = '';
  function avisaCnpj(texto, tipo){
    statusCnpj.textContent = texto || '';
    statusCnpj.className = 'status-campo' + (tipo ? ' status-campo--'+tipo : '');
    statusCnpj.hidden = !texto;
  }

  cnpj.addEventListener('input', function(){
    cnpj.value = mascaraCnpj(cnpj.value);
    cnpj.setCustomValidity('');
    avisaCnpj('');
  });

  /* Consulta à Receita Federal (BrasilAPI), direto do navegador — mesmo padrão
     usado nas outras LPs do site (facilities, segurança patrimonial).
     Fail-open: dígito inválido é a única coisa que barra o envio; a consulta
     em si nunca bloqueia (API fora do ar/lenta não deve custar um lead real). */
  cnpj.addEventListener('blur', function(){
    var limpo = cnpj.value.toUpperCase().replace(/[^0-9A-Z]/g,'');
    if (!limpo) return;
    if (!cnpjValido(limpo)){
      avisaCnpj('CNPJ inválido — confira os números digitados.', 'erro');
      return;
    }
    if (limpo === consultado) return;
    consultado = limpo;
    avisaCnpj('Consultando na base da Receita…', 'carregando');

    fetch('https://brasilapi.com.br/api/cnpj/v1/' + limpo)
      .then(function(r){
        if (r.status === 404 || r.status === 400) return Promise.reject('nao_encontrado');
        return r.ok ? r.json() : Promise.reject('erro_upstream');
      })
      .then(function(d){
        var razao = (d.razao_social || '').trim(), fantasia = (d.nome_fantasia || '').trim();
        var nome = razao || fantasia;
        var empresa = document.getElementById('campo-empresa');
        if (nome && empresa && !empresa.value.trim()) empresa.value = nome;
        var cidade = document.getElementById('cidade'), uf = document.getElementById('uf');
        if (!cidade.value.trim() && d.municipio) cidade.value = d.municipio;
        if (!uf.value && d.uf) uf.value = d.uf;
        var situacao = (d.descricao_situacao_cadastral || '').toUpperCase();
        if (situacao && situacao !== 'ATIVA') avisaCnpj((nome || 'CNPJ válido') + ' — situação cadastral: ' + situacao + '.', 'aviso');
        else avisaCnpj(nome || 'CNPJ válido.', 'ok');
      })
      .catch(function(motivo){
        if (motivo === 'nao_encontrado') avisaCnpj('CNPJ válido. Não localizamos o cadastro agora.', 'ok');
        else avisaCnpj('CNPJ válido. A consulta à Receita não respondeu — seguimos assim mesmo.', 'ok');
      });
  });

  /* ---------- Rastreamento (UTMs, click ids, Meta/Google) ----------
     Mesmo padrão usado nas outras LPs Orcali, para o lead cair na mesma
     planilha e a conversão "Leads LP" contar certo no Google/Meta. */
  function getCookie(n){ var m = document.cookie.match(new RegExp('(^| )'+n+'=([^;]+)')); return m ? decodeURIComponent(m[2]) : ''; }
  function genEvtId(){ return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){ var r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16); }); }
  function getUtms(){
    var p = new URLSearchParams(location.search), keys = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'], cur = {};
    keys.forEach(function(k){ if (p.get(k)) cur[k] = p.get(k); });
    var st = localStorage.getItem('_utms');
    if (!st && Object.keys(cur).length) localStorage.setItem('_utms', JSON.stringify(cur));
    var stored = localStorage.getItem('_utms');
    return stored ? JSON.parse(stored) : cur;
  }
  function getClickIds(){
    var p = new URLSearchParams(location.search), ks = ['fbclid','gclid','ttclid','msclkid','gbraid','wbraid'], cur = {};
    ks.forEach(function(k){ if (p.get(k)) cur[k] = p.get(k); });
    if (Object.keys(cur).length) localStorage.setItem('_clickids', JSON.stringify(cur));
    var st = localStorage.getItem('_clickids');
    return st ? JSON.parse(st) : {};
  }
  function getBrowserData(){
    var ids = getClickIds(), fbclid = ids.fbclid || '', fbc = getCookie('_fbc');
    if (!fbc && fbclid) fbc = 'fb.1.' + Date.now() + '.' + fbclid;
    return {
      event_id: genEvtId(), fbp: getCookie('_fbp'), fbc: fbc, fbclid: fbclid,
      gclid: ids.gclid || '', gbraid: ids.gbraid || '', wbraid: ids.wbraid || '',
      ttclid: ids.ttclid || '', msclkid: ids.msclkid || '',
      page_url: location.href, referrer: document.referrer, user_agent: navigator.userAgent,
      language: navigator.language, screen: screen.width+'x'+screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, utms: getUtms()
    };
  }
  function fireMetaLead(br){ try{
    if (typeof fbq !== 'function') return;
    fbq('track','Lead',{},{eventID: br.event_id});
  }catch(e){} }
  function fireGoogleConv(f, br){ try{
    if (typeof gtag !== 'function') return;
    var ud = {}, addr = {};
    var email = (f.get('email')||'').trim().toLowerCase();
    if (email) ud.email = email;
    var nome = (f.get('nome')||'').trim();
    if (nome){ var p = nome.split(/\s+/); addr.first_name = p[0]; if (p.length>1) addr.last_name = p.slice(1).join(' '); }
    var d = (f.get('telefone')||'').replace(/\D/g,'');
    if (d.indexOf('55')===0 && d.length>=12) d = d.slice(2);
    if (d.indexOf('0')===0) d = d.slice(1);
    if (d.length===10) d = d.slice(0,2)+'9'+d.slice(2);
    if (d.length===11) ud.phone_number = '+55'+d;
    var cid = (f.get('cidade')||'').trim(), uf = (f.get('uf')||'').trim();
    if (cid) addr.city = cid;
    if (uf.length===2) addr.region = uf;
    addr.country = 'BR';
    if (Object.keys(addr).length>1) ud.address = addr;
    if (Object.keys(ud).length) gtag('set','user_data', ud);
    gtag('event','conversion',{send_to:'AW-996720589/vXGgCNK8mdMcEM3_otsD', transaction_id: br.event_id});
  }catch(e){} }

  /* PageView — mesmo event_id enviado ao Pixel (browser) e ao /api/pageview
     (CAPI), para a Meta deduplicar os dois sinais e contar 1 só. */
  var _pvId = genEvtId();
  if (typeof fbq === 'function') fbq('track','PageView',{},{eventID:_pvId});
  fetch('/api/pageview', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({event_id:_pvId, fbp:getCookie('_fbp'), fbc:getCookie('_fbc'), page_url:location.href, user_agent:navigator.userAgent})
  }).catch(function(){});

  /* Envio do formulário — grava na mesma planilha de leads das outras LPs Orcali. */
  var form = document.getElementById('formOrcamento'),
      sucesso = document.getElementById('sucesso'),
      btn = document.getElementById('btnEnviar'),
      erro = document.getElementById('erroForm');

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if (!form.reportValidity()) return;
    erro.hidden = true;
    btn.disabled = true;
    btn.textContent = 'Enviando…';

    var f = new FormData(form);
    var br = getBrowserData();

    fetch('/api/leads', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(Object.assign({
        name:     f.get('nome'),
        email:    f.get('email'),
        phone:    f.get('telefone'),
        empresa:  f.get('empresa'),
        cnpj:     f.get('cnpj'),
        segmento: f.get('segmento'),
        estado:   f.get('uf'),
        cidade:   f.get('cidade'),
        message:  f.get('mensagem')
      }, br))
    })
    .then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function(){
      fireGoogleConv(f, br);
      fireMetaLead(br);
      if (window.dataLayer) window.dataLayer.push({event: 'lead_limpeza'});
      form.style.display = 'none';
      sucesso.classList.add('ativo');
      sucesso.scrollIntoView({block: 'center', behavior: 'smooth'});
    })
    .catch(function(err){
      console.error(err);
      erro.hidden = false;
      erro.textContent = 'Não conseguimos enviar agora. Tente novamente ou fale pelo WhatsApp (48) 99809-0090.';
      btn.disabled = false;
      btn.textContent = 'Solicitar Orçamento';
    });
  });


  /* Todo CTA leva ao formulário: rolagem suave, foco no primeiro campo e evento de medição */
  var suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.addEventListener('click', function(e){
    var a = e.target.closest('a[href="#orcamento"], a[href$="#orcamento"]');
    if (!a) return;
    e.preventDefault();
    var alvo = document.getElementById('orcamento');
    if (!alvo) return;
    if (window.dataLayer) window.dataLayer.push({event:'cta_orcamento', cta:(a.textContent||'').trim()});
    var navMobAberto = document.getElementById('navMob');
    if (navMobAberto) navMobAberto.classList.remove('aberto');
    alvo.scrollIntoView({behavior: suave ? 'smooth' : 'auto', block:'start'});
    var campo = document.getElementById('nome');
    if (!campo || document.getElementById('sucesso').classList.contains('ativo')) return;
    // só foca depois que a rolagem parar, senão o navegador cancela a animação
    var parado, ultimo = -1;
    (function espera(){
      var y = window.scrollY;
      if (y === ultimo){ clearTimeout(parado); campo.focus({preventScroll:true}); return; }
      ultimo = y; parado = setTimeout(espera, 90);
    })();
  });

  document.querySelectorAll('[data-remover-se-falhar]').forEach(function(img){
    img.addEventListener('error', function(){ img.remove(); });
  });

  /* Vídeo: o player do YouTube só entra na página depois do clique */
  document.querySelectorAll('.video-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var cx = btn.closest('.video');
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + cx.dataset.yt + '?autoplay=1&rel=0&modestbranding=1';
      f.title = 'Vídeo institucional Orcali';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      f.allowFullscreen = true;
      cx.innerHTML = '';
      cx.appendChild(f);
    });
  });

  /* Prévia A/B do hero: só aparece com ?ab=1 na URL */
  if (new URLSearchParams(location.search).has('ab')) document.getElementById('painelAB').hidden = false;
  var variantes = {
    a: {
      h1:'Limpeza e conservação',
      sub:'Terceirização de limpeza empresarial com padrão auditável Orcali',
      desc:'Equipes próprias, treinadas e supervisionadas. Mais de 58 anos em Santa Catarina e Paraná.'
    },
    b: {
      h1:'Limpeza e conservação completa, uma só gestão.',
      sub:'Da higienização diária à conservação de áreas externas.',
      desc:'Equipe própria, treinada e dimensionada para a sua operação, com equipes volantes garantindo que nenhum posto fique descoberto.'
    }
  };
  document.querySelectorAll('.ab button').forEach(function(b){
    b.addEventListener('click', function(){
      var v = variantes[b.dataset.hero];
      document.getElementById('heroH1').textContent = v.h1;
      document.getElementById('heroSub').textContent = v.sub;
      document.getElementById('heroDesc').textContent = v.desc;
      document.querySelectorAll('.ab button').forEach(function(o){ o.setAttribute('aria-pressed','false'); });
      b.setAttribute('aria-pressed','true');
    });
  });
})();
