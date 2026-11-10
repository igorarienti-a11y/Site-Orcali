/* Filtro de perfil dos formulários das LPs ORCALI (reunião com a ORCALI em 09/11/2026).
   - Órgão público: orienta para o comercial público e não envia lead.
   - Temporário: explica que a ORCALI só atende contrato anual (mínimo de 12 meses,
     5 dias por semana e 4 horas por dia) e oferece o anual de novo. Quem recusa encerra sem lead.
   O bloqueio roda na captura do evento submit no document, antes do envio de cada página,
   então nada vai para /api/leads e nenhuma conversão dispara nesses casos. */
(function () {
  'use strict';

  var EMAIL = 'comercialpublico@orcali.com.br';
  var form = document.getElementById('leadform') || document.getElementById('formOrcamento');
  if (!form) return;

  var estilo = document.createElement('style');
  estilo.textContent =
    '.fp-aviso{margin-top:10px;padding:14px 16px;border-radius:10px;background:#FFF8E6;' +
    'border:1.5px solid #F2C94C;color:#3A2E00;font-size:.92rem;line-height:1.5;text-align:left}' +
    '.fp-aviso[hidden]{display:none}' +
    '.fp-aviso p{margin:0 0 10px}.fp-aviso p:last-child{margin-bottom:0}' +
    '.fp-aviso a{color:inherit;font-weight:700;text-decoration:underline;white-space:nowrap}' +
    '.fp-botoes{display:flex;flex-wrap:wrap;gap:8px}' +
    '.fp-botoes button{font:inherit;font-size:.9rem;font-weight:600;padding:10px 14px;border-radius:8px;' +
    'border:1.5px solid #002E6E;background:#fff;color:#002E6E;cursor:pointer}' +
    '.fp-botoes button.fp-sim{background:#002E6E;color:#fff}' +
    '.fp-fim{padding:24px 20px;text-align:center}';
  document.head.appendChild(estilo);

  function caixaDoCampo(nome) {
    var r = form.querySelector('input[name="' + nome + '"]');
    if (!r) return null;
    return r.closest('.field, .campo') || r.parentNode.parentNode;
  }

  function marcado(nome) {
    var r = form.querySelector('input[name="' + nome + '"]:checked');
    return r ? r.value : '';
  }

  function aviso(depoisDe, html) {
    var d = document.createElement('div');
    d.className = 'fp-aviso';
    d.setAttribute('role', 'status');
    d.hidden = true;
    d.innerHTML = html;
    depoisDe.appendChild(d);
    return d;
  }

  function mostra(el) {
    el.hidden = false;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  // Órgão público
  var caixaSetor = caixaDoCampo('setor');
  var avisoPublico = caixaSetor && aviso(caixaSetor,
    '<p>O atendimento a órgãos públicos é feito pelo nosso comercial público. ' +
    'Envie sua solicitação para <a href="mailto:' + EMAIL + '">' + EMAIL + '</a>.</p>');

  // Temporário
  var caixaContrato = caixaDoCampo('contrato');
  var avisoTemp = caixaContrato && aviso(caixaContrato,
    '<p>A ORCALI trabalha somente com contratos anuais: mínimo de 12 meses, 5 dias por semana ' +
    'e 4 horas por dia. Serviços temporários ou eventuais nós não atendemos no momento.</p>' +
    '<p>Um contrato anual nessas condições faz sentido para vocês?</p>' +
    '<div class="fp-botoes"><button type="button" class="fp-sim">Sim, quero contrato anual</button>' +
    '<button type="button" class="fp-nao">Não, preciso de temporário</button></div>');

  var fim = document.createElement('div');
  fim.className = 'fp-aviso fp-fim';
  fim.setAttribute('role', 'status');
  fim.hidden = true;
  fim.innerHTML = '<p><strong>Obrigado pelo contato!</strong></p>' +
    '<p>No momento a ORCALI não atende serviços temporários ou eventuais. ' +
    'Se no futuro precisar de um contrato anual, é só voltar por aqui.</p>';
  form.parentNode.insertBefore(fim, form.nextSibling);

  form.addEventListener('change', function (e) {
    var t = e.target;
    if (!t || t.type !== 'radio') return;
    if (t.name === 'setor' && avisoPublico) {
      if (t.value === 'Público') mostra(avisoPublico); else avisoPublico.hidden = true;
    }
    if (t.name === 'contrato' && avisoTemp) {
      if (t.value === 'Temporário') mostra(avisoTemp); else avisoTemp.hidden = true;
    }
  });

  if (avisoTemp) {
    avisoTemp.querySelector('.fp-sim').addEventListener('click', function () {
      var anual = form.querySelector('input[name="contrato"][value="Anual"]');
      if (anual) {
        anual.checked = true;
        anual.dispatchEvent(new Event('change', { bubbles: true }));
      }
      avisoTemp.hidden = true;
    });
    avisoTemp.querySelector('.fp-nao').addEventListener('click', function () {
      form.style.display = 'none';
      fim.hidden = false;
      fim.scrollIntoView({ block: 'center', behavior: 'smooth' });
      if (window.dataLayer) window.dataLayer.push({ event: 'perfil_temporario_encerrado' });
    });
  }

  document.addEventListener('submit', function (e) {
    if (e.target !== form) return;
    var bloqueio = null;
    if (marcado('setor') === 'Público') bloqueio = avisoPublico;
    else if (marcado('contrato') === 'Temporário') bloqueio = avisoTemp;
    if (!bloqueio) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    mostra(bloqueio);
  }, true);
})();
