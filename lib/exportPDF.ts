/**
 * Wedding PDF Export — Padrão de Excelência
 * Suporta exportações filtradas: Lista completa, por família (Noiva/Noivo), por mesa.
 * Usa window.print() — output vectorial, sem dependências externas.
 */

export interface Guest {
  id: string;
  name: string;
  phone?: string;
  side: 'Bride' | 'Groom';
  diet: string;
  dietDetails?: string;
  musicRequest?: string;
  needsAccommodation: 'Yes' | 'No';
  accommodationDetails?: string;
  tableId: number | null;
  checkIn?: boolean;
}

export interface Table {
  id: number;
  name: string;
}

export type ExportScope =
  | { type: 'all' }
  | { type: 'side'; side: 'Bride' | 'Groom' }
  | { type: 'table'; tableId: number };

// ── CSS de impressão ──────────────────────────────────────────────────────────
function getPrintCSS(): string {
  return `
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: white !important; }
      body > *:not(#pdf-print-root) { display: none !important; visibility: hidden !important; }
      #pdf-print-root { display: block !important; visibility: visible !important; }
      .pdf-page-break { page-break-after: always; break-after: page; }
      .pdf-no-break { page-break-inside: avoid; break-inside: avoid; }
      @page { size: A4 portrait; margin: 12mm 14mm; }
      @page :first { margin-top: 8mm; }
    }
    #pdf-print-root {
      font-family: Georgia, 'Times New Roman', serif;
      color: #1a1a1a;
      background: white;
      font-size: 10px;
      line-height: 1.4;
    }
  `;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sideLabel = (side: string) => side === 'Bride' ? '♥ Noiva' : '♦ Noivo';
const sideColor = (side: string) => side === 'Bride' ? '#800020' : '#001B3D';

function scopeTitle(scope: ExportScope, tables: Table[], tableNames: Record<number, string>): string {
  if (scope.type === 'all') return 'Lista Oficial de Convidados';
  if (scope.type === 'side') return scope.side === 'Bride' ? 'Família da Noiva' : 'Família do Noivo';
  if (scope.type === 'table') {
    const name = tableNames[scope.tableId];
    return name ? `Mesa ${scope.tableId} · ${name}` : `Mesa ${scope.tableId}`;
  }
  return 'Lista de Convidados';
}

function scopeTagline(scope: ExportScope): string {
  if (scope.type === 'all') return 'Documento completo — todos os convidados';
  if (scope.type === 'side') return scope.side === 'Bride' ? '— Lado da Noiva' : '— Lado do Noivo';
  if (scope.type === 'table') return '— Lista de mesa individual';
  return '';
}

// ── Cabeçalho ─────────────────────────────────────────────────────────────────
function buildHeader(scope: ExportScope, tables: Table[], tableNames: Record<number, string>): string {
  const accentColor = scope.type === 'side' && scope.side === 'Bride'
    ? '#800020'
    : scope.type === 'side' && scope.side === 'Groom'
    ? '#001B3D'
    : '#001B3D';

  return `
    <div class="pdf-no-break" style="text-align:center; padding:20px 0 16px; border-bottom:2.5px solid ${accentColor}; margin-bottom:18px;">
      <div style="font-size:16px; color:#C5A880; letter-spacing:8px; margin-bottom:10px;">✦ · ✦ · ✦</div>
      <h1 style="font-size:24px; font-weight:700; letter-spacing:4px; margin:0 0 5px; color:${accentColor}; text-transform:uppercase;">
        Lumiana &amp; Vicente
      </h1>
      <p style="font-size:10px; font-weight:700; color:${accentColor}; letter-spacing:2px; text-transform:uppercase; margin:0 0 4px;">
        ${esc(scopeTitle(scope, tables, tableNames))}
      </p>
      <p style="font-size:9px; color:#aaa; margin:0;">
        Maputo · 29 de Agosto de 2026
        <span style="color:#ccc; margin:0 6px;">·</span>
        <em style="color:#bbb;">${esc(scopeTagline(scope))}</em>
      </p>
    </div>
  `;
}

// ── Stats card ────────────────────────────────────────────────────────────────
function buildStatCard(value: number | string, label: string, color = '#001B3D'): string {
  return `
    <div style="border:1px solid #e5e7eb; border-radius:8px; padding:12px 8px; text-align:center; background:white;">
      <div style="font-size:20px; font-weight:700; color:${color}; line-height:1;">${value}</div>
      <div style="font-size:8px; color:#999; letter-spacing:1px; text-transform:uppercase; margin-top:4px;">${label}</div>
    </div>
  `;
}

// ── Stats — adapta ao scope ───────────────────────────────────────────────────
function buildStats(guests: Guest[], scope: ExportScope): string {
  const total = guests.length;
  const checkedIn = guests.filter(g => g.checkIn).length;
  const allocated = guests.filter(g => g.tableId !== null).length;
  const dietary = guests.filter(g => g.diet && g.diet !== 'Nenhuma').length;
  const accomm = guests.filter(g => g.needsAccommodation === 'Yes').length;

  let cards = '';
  if (scope.type === 'all') {
    const bride = guests.filter(g => g.side === 'Bride').length;
    const groom = guests.filter(g => g.side === 'Groom').length;
    cards = `
      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">
        ${buildStatCard(total, 'Total', '#001B3D')}
        ${buildStatCard(`${bride} · ${groom}`, 'Noiva · Noivo', '#800020')}
        ${buildStatCard(allocated, 'Alocados', '#15803d')}
        ${buildStatCard(checkedIn, 'Check-in', '#0369a1')}
      </div>
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-top:8px;">
        ${buildStatCard(total - allocated, 'Sem Mesa', total - allocated > 0 ? '#b45309' : '#15803d')}
        ${buildStatCard(accomm, 'Alojamento', '#7c3aed')}
        ${buildStatCard(dietary, 'Dieta Especial', '#be185d')}
      </div>
    `;
  } else {
    cards = `
      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">
        ${buildStatCard(total, 'Convidados', '#001B3D')}
        ${buildStatCard(checkedIn, 'Check-in', '#15803d')}
        ${buildStatCard(dietary, 'Dieta Especial', '#be185d')}
        ${buildStatCard(accomm, 'Alojamento', '#7c3aed')}
      </div>
    `;
  }

  return `
    <div class="pdf-no-break" style="margin-bottom:18px;">
      <h2 style="font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#001B3D; border-bottom:1px solid #C5A880; padding-bottom:5px; margin:0 0 10px;">
        Resumo
      </h2>
      ${cards}
    </div>
  `;
}

// ── Plano de mesas (apenas scope=all ou scope=side) ───────────────────────────
function buildTablePlan(guests: Guest[], tables: Table[], tableNames: Record<number, string>): string {
  const filledTables = tables.filter(t => guests.some(g => g.tableId === t.id));
  if (filledTables.length === 0) return '';

  const cards = filledTables.map(table => {
    const tGuests = guests.filter(g => g.tableId === table.id);
    const name = tableNames[table.id] || '';
    const rows = tGuests.map((g, i) => `
      <div style="font-size:8.5px; padding:2.5px 0; border-bottom:1px dotted #f0f0f0; display:flex; justify-content:space-between;">
        <span>${i + 1}. ${esc(g.name)}</span>
        <span style="color:${sideColor(g.side)}; font-size:7.5px; font-weight:600;">${g.side === 'Bride' ? '♥' : '♦'}</span>
      </div>
    `).join('');
    const empty = Array(Math.max(0, 6 - tGuests.length))
      .fill(`<div style="font-size:8px; padding:2.5px 0; border-bottom:1px dotted #f0f0f0; color:#e0e0e0; font-style:italic;">— livre —</div>`)
      .join('');

    return `
      <div class="pdf-no-break" style="border:1px solid #e5e7eb; border-radius:7px; overflow:hidden;">
        <div style="background:#001B3D; color:white; padding:5px 9px; font-size:8.5px; font-weight:700; letter-spacing:1px; display:flex; justify-content:space-between;">
          <span>🍽 MESA ${table.id}${name ? ` · ${name}` : ''}</span>
          <span style="opacity:0.7; font-size:7.5px;">${tGuests.length}/6</span>
        </div>
        <div style="padding:6px 8px;">${rows}${empty}</div>
      </div>
    `;
  }).join('');

  return `
    <div style="margin-bottom:16px;">
      <h2 style="font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#001B3D; border-bottom:1px solid #C5A880; padding-bottom:5px; margin:0 0 10px;">
        Disposição das Mesas
      </h2>
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">${cards}</div>
    </div>
  `;
}

// ── Convidados sem mesa ────────────────────────────────────────────────────────
function buildUnallocated(guests: Guest[]): string {
  const list = guests.filter(g => g.tableId === null);
  if (list.length === 0) return '';
  const pills = list.map(g => `
    <div style="display:inline-block; font-size:8.5px; padding:2px 8px; margin:2px; border:1px solid ${sideColor(g.side)}; border-radius:20px; color:${sideColor(g.side)}; background:${g.side === 'Bride' ? '#fff0f3' : '#eff6ff'};">
      ${esc(g.name)}
    </div>
  `).join('');
  return `
    <div class="pdf-no-break" style="margin-bottom:16px; padding:10px 12px; background:#fffbeb; border:1px solid #fde68a; border-radius:8px;">
      <h3 style="font-size:9px; font-weight:700; color:#b45309; margin:0 0 8px; letter-spacing:1px; text-transform:uppercase;">
        ⚠ Sem Mesa Atribuída (${list.length})
      </h3>
      <div>${pills}</div>
    </div>
  `;
}

// ── Tabela de convidados — adapta colunas ao scope ────────────────────────────
function buildGuestTable(guests: Guest[], scope: ExportScope): string {
  // Ordenação: Noiva → Noivo → alfabética dentro de cada lado
  const sorted = [...guests].sort((a, b) => {
    if (scope.type === 'all' && a.side !== b.side) return a.side === 'Bride' ? -1 : 1;
    return a.name.localeCompare(b.name, 'pt');
  });

  const isTableScope = scope.type === 'table';
  const isSideScope = scope.type === 'side';

  // Colunas dinâmicas
  const showFamily = scope.type === 'all';
  const showTable = !isTableScope;
  const showSide = isTableScope; // Numa mesa, mostrar família em vez de mesa

  const chunkSize = isTableScope ? 40 : 35;
  const chunks: Guest[][] = [];
  for (let i = 0; i < sorted.length; i += chunkSize) chunks.push(sorted.slice(i, i + chunkSize));

  const headerBg = scope.type === 'side'
    ? (scope.side === 'Bride' ? '#800020' : '#001B3D')
    : '#001B3D';

  const th = (content: string, style = '') =>
    `<th style="padding:6px 7px; font-weight:600; font-size:8px; letter-spacing:0.5px; ${style}">${content}</th>`;

  const tableHeader = `
    <thead>
      <tr style="background:${headerBg}; color:white;">
        ${th('#', 'text-align:center; width:24px;')}
        ${th('Nome Completo', 'text-align:left;')}
        ${showFamily ? th('Família', 'text-align:center; width:60px;') : ''}
        ${showTable ? th('Mesa', 'text-align:center; width:50px;') : ''}
        ${isTableScope ? th('Família', 'text-align:center; width:60px;') : ''}
        ${th('Check-in', 'text-align:center; width:48px;')}
        ${th('Dieta', 'text-align:left; width:80px;')}
        ${th('Aloj.', 'text-align:center; width:40px;')}
        ${th('Música Pedida', 'text-align:left;')}
      </tr>
    </thead>
  `;

  const tables = chunks.map((chunk, ci) => {
    const rows = chunk.map((g, i) => {
      const idx = ci * chunkSize + i + 1;
      const bg = idx % 2 === 0 ? '#f9fafb' : 'white';
      const mesaLabel = g.tableId
        ? `Mesa ${g.tableId}`
        : `<span style="color:#f59e0b; font-weight:600;">—</span>`;
      const checkIn = g.checkIn
        ? `<span style="color:#15803d; font-weight:700;">✓</span>`
        : `<span style="color:#d1d5db;">—</span>`;
      const diet = g.diet && g.diet !== 'Nenhuma'
        ? `<span style="color:#be185d; font-size:7.5px; font-weight:600;">${esc(g.diet)}</span>`
        : '<span style="color:#d1d5db;">—</span>';
      const accomm = g.needsAccommodation === 'Yes'
        ? `<span style="color:#7c3aed; font-weight:700;">Sim</span>`
        : '<span style="color:#d1d5db;">—</span>';
      const music = g.musicRequest
        ? `<em style="color:#555; font-size:7.5px;">${esc(g.musicRequest.substring(0, 32))}${g.musicRequest.length > 32 ? '…' : ''}</em>`
        : '<span style="color:#d1d5db;">—</span>';
      const familyBadge = `<span style="color:${sideColor(g.side)}; font-weight:600; font-size:8px;">${sideLabel(g.side)}</span>`;

      return `
        <tr class="pdf-no-break" style="background:${bg}; border-bottom:1px solid #f3f4f6;">
          <td style="padding:4px 7px; text-align:center; color:#999; font-size:8px;">${idx}</td>
          <td style="padding:4px 7px; font-weight:600; font-size:8.5px; color:#1a1a1a;">${esc(g.name)}</td>
          ${showFamily ? `<td style="padding:4px 7px; text-align:center;">${familyBadge}</td>` : ''}
          ${showTable ? `<td style="padding:4px 7px; text-align:center; font-size:8.5px;">${mesaLabel}</td>` : ''}
          ${isTableScope ? `<td style="padding:4px 7px; text-align:center;">${familyBadge}</td>` : ''}
          <td style="padding:4px 7px; text-align:center; font-size:8.5px;">${checkIn}</td>
          <td style="padding:4px 7px; font-size:8px;">${diet}</td>
          <td style="padding:4px 7px; text-align:center; font-size:8px;">${accomm}</td>
          <td style="padding:4px 7px; font-size:8px;">${music}</td>
        </tr>
      `;
    }).join('');

    return `
      <table style="width:100%; border-collapse:collapse;">
        ${tableHeader}
        <tbody>${rows}</tbody>
      </table>
      ${ci < chunks.length - 1 ? '<div class="pdf-page-break"></div>' : ''}
    `;
  }).join('');

  const sectionTitle = isTableScope
    ? `Convidados da Mesa`
    : isSideScope
    ? `Lista — ${scope.side === 'Bride' ? 'Família da Noiva' : 'Família do Noivo'}`
    : 'Lista Completa de Convidados';

  return `
    <div>
      <h2 style="font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#001B3D; border-bottom:1px solid #C5A880; padding-bottom:5px; margin:0 0 10px;">
        ${sectionTitle}
      </h2>
      ${tables}
    </div>
  `;
}

// ── Dietas ────────────────────────────────────────────────────────────────────
function buildDietarySection(guests: Guest[]): string {
  const list = guests.filter(g => g.diet && g.diet !== 'Nenhuma');
  if (list.length === 0) return '';
  const rows = list.map(g => `
    <div class="pdf-no-break" style="display:flex; gap:10px; padding:5px 8px; border-bottom:1px solid #f3f4f6; font-size:8.5px; align-items:center;">
      <span style="font-weight:600; min-width:150px;">${esc(g.name)}</span>
      <span style="color:${sideColor(g.side)}; font-size:7.5px; min-width:55px;">${sideLabel(g.side)}</span>
      <span style="color:#be185d; font-weight:600; min-width:90px;">${esc(g.diet)}</span>
      <span style="color:#666; font-style:italic; flex:1;">${g.dietDetails ? esc(g.dietDetails) : '—'}</span>
      <span style="color:#999; font-size:7.5px;">${g.tableId ? `Mesa ${g.tableId}` : 'Sem mesa'}</span>
    </div>
  `).join('');
  return `
    <div class="pdf-no-break" style="margin-top:16px; padding:10px 12px; border:1px solid #fce7f3; border-radius:8px; background:#fdf2f8;">
      <h3 style="font-size:9px; font-weight:700; color:#be185d; margin:0 0 8px; letter-spacing:1px; text-transform:uppercase;">
        🍽 Restrições Alimentares (${list.length})
      </h3>
      ${rows}
    </div>
  `;
}

// ── Rodapé ────────────────────────────────────────────────────────────────────
function buildFooter(guestCount: number, scope: ExportScope, tables: Table[], tableNames: Record<number, string>): string {
  const now = new Date().toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  const scopeStr = scope.type === 'all'
    ? 'Lista completa'
    : scope.type === 'side'
    ? (scope.side === 'Bride' ? 'Família da Noiva' : 'Família do Noivo')
    : `Mesa ${scope.tableId}`;

  return `
    <div style="margin-top:24px; padding-top:10px; border-top:1px solid #e5e7eb; text-align:center;">
      <div style="font-size:10px; color:#C5A880; letter-spacing:4px; margin-bottom:4px;">· · ·</div>
      <p style="font-size:7.5px; color:#bbb; letter-spacing:1px; margin:0;">
        Gerado em ${now} · ${guestCount} convidados · ${scopeStr} · Confidencial
      </p>
    </div>
  `;
}

// ── Motor de impressão ────────────────────────────────────────────────────────
function printHTML(html: string): void {
  const existing = document.getElementById('pdf-print-root');
  if (existing) existing.remove();
  const existingStyle = document.getElementById('pdf-print-styles');
  if (existingStyle) existingStyle.remove();

  const container = document.createElement('div');
  container.id = 'pdf-print-root';
  container.style.cssText = 'display:none; position:absolute; top:0; left:0; width:100%;';
  container.innerHTML = html;
  document.body.appendChild(container);

  const style = document.createElement('style');
  style.id = 'pdf-print-styles';
  style.textContent = getPrintCSS();
  document.head.appendChild(style);

  setTimeout(() => {
    window.print();
    setTimeout(() => { container.remove(); style.remove(); }, 1500);
  }, 150);
}

// ── API pública: exportação inteligente ───────────────────────────────────────
export function generateWeddingPDF(
  allGuests: Guest[],
  tables: Table[],
  tableNames: Record<number, string>,
  scope: ExportScope = { type: 'all' }
): void {
  if (typeof window === 'undefined') return;

  // Filtrar convidados conforme scope
  let guests: Guest[];
  if (scope.type === 'all') {
    guests = allGuests;
  } else if (scope.type === 'side') {
    guests = allGuests.filter(g => g.side === scope.side);
  } else {
    guests = allGuests.filter(g => g.tableId === scope.tableId);
  }

  const isTableScope = scope.type === 'table';
  const isAllScope = scope.type === 'all';

  const content = `
    ${buildHeader(scope, tables, tableNames)}
    ${buildStats(guests, scope)}
    ${isAllScope ? buildTablePlan(guests, tables, tableNames) : ''}
    ${isAllScope ? buildUnallocated(guests) : ''}
    ${isAllScope ? '<div class="pdf-page-break"></div>' : ''}
    ${buildGuestTable(guests, scope)}
    ${buildDietarySection(guests)}
    ${buildFooter(guests.length, scope, tables, tableNames)}
  `;

  printHTML(content);
}

// ── CSV inteligente ───────────────────────────────────────────────────────────
export function generateCSV(
  allGuests: Guest[],
  scope: ExportScope = { type: 'all' },
  tableNames: Record<number, string> = {}
): void {
  let guests: Guest[];
  let filename: string;

  if (scope.type === 'all') {
    guests = allGuests;
    filename = `convidados_todos_${new Date().toISOString().slice(0, 10)}`;
  } else if (scope.type === 'side') {
    guests = allGuests.filter(g => g.side === scope.side);
    filename = `convidados_${scope.side === 'Bride' ? 'noiva' : 'noivo'}_${new Date().toISOString().slice(0, 10)}`;
  } else {
    guests = allGuests.filter(g => g.tableId === scope.tableId);
    const name = tableNames[scope.tableId] ? `_${tableNames[scope.tableId].replace(/\s+/g, '_')}` : '';
    filename = `mesa_${scope.tableId}${name}_${new Date().toISOString().slice(0, 10)}`;
  }

  const BOM = '\uFEFF';
  const headers = ['#', 'Nome', 'Família', 'Mesa', 'Check-in', 'Dieta', 'Detalhes Dieta', 'Alojamento', 'Música'];
  const sorted = [...guests].sort((a, b) => {
    if (scope.type === 'all' && a.side !== b.side) return a.side === 'Bride' ? -1 : 1;
    return a.name.localeCompare(b.name, 'pt');
  });

  const rows = sorted.map((g, i) => [
    i + 1,
    g.name,
    g.side === 'Bride' ? 'Noiva' : 'Noivo',
    g.tableId ? `Mesa ${g.tableId}` : 'Sem mesa',
    g.checkIn ? 'Sim' : 'Não',
    g.diet || 'Nenhuma',
    g.dietDetails || '',
    g.needsAccommodation === 'Yes' ? 'Sim' : 'Não',
    g.musicRequest || '',
  ]);

  const csv = BOM + [headers.join(';'), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
