let dadosOriginais = [];

// 1. CARREGAR CRONOGRAMA PRINCIPAL (GERAL)
async function carregarCronograma(filtro = 'all') {
    try {
        if (dadosOriginais.length === 0) {
            const response = await fetch('cronograma.csv');
            const data = await response.text();
            const linhas = data.split(/\r?\n/);
            
            dadosOriginais = linhas.slice(1).map(linha => {
                const col = linha.split(',');
                if (!linha || col.length < 3) return null;
                return {
                    data: col[0]?.trim(), // Esperado: DD/MM
                    dia: col[1]?.trim(),
                    contA: col[2]?.trim() || "",
                    contB: col[3]?.trim() || "",
                    disciplinas: col[4]?.trim() || "-",
                    lugar: col[5]?.trim() || "-"
                };
            }).filter(i => i !== null);
        }

        const tabelaBody = document.getElementById('table-body');
        tabelaBody.innerHTML = ''; 

        // Lógica para destacar o dia de hoje (Formato DD/MM)
        const hoje = new Date();
        const dia = String(hoje.getDate()).padStart(2, '0');
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const hojeFormatado = `${dia}/${mes}`;

        const dadosFiltrados = filtro === 'all' 
            ? dadosOriginais 
            : dadosOriginais.filter(item => item.disciplinas.includes(filtro));

        dadosFiltrados.forEach(item => {
            const tr = document.createElement('tr');
            
            // Verifica se a data do CSV bate com hoje (ex: 25/03)
            if (item.data === hojeFormatado) {
                tr.classList.add('today-highlight');
            }
            
            const infoExtra = [item.contA, item.contB].filter(t => t.length > 0).join(' | ');

            tr.innerHTML = `
                <td>${item.data}</td>
                <td><strong>${item.dia}</strong></td>
                <td>
                    <span style="color:#fff; font-weight:600">${item.disciplinas}</span><br>
                    <small style="color:#888">${infoExtra}</small>
                </td>
                <td><code>${item.lugar}</code></td>
            `;
            tr.onclick = () => abrirModal(item);
            tabelaBody.appendChild(tr);
        });

        atualizarPilulaInfo(filtro);
    } catch (e) {
        console.error("Erro ao carregar cronograma.csv:", e);
    }
}

// 2. MODAL DE DETALHES DA TABELA
function abrirModal(item) {
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').innerText = `${item.dia} - ${item.data}`;
    document.getElementById('modal-info').innerHTML = `<p><strong>Local:</strong> ${item.lugar}</p>`;
    document.getElementById('modal-notes').innerText = item.contA || "Sem observações.";
    modal.style.display = 'flex';
}

// 3. ATUALIZA A PÍLULA DE FILTRO (SUB-MENU)
function atualizarPilulaInfo(materia) {
    const pill = document.getElementById('sub-menu');
    if (materia === 'all') {
        pill.style.display = 'none';
        return;
    }
    pill.style.display = 'flex';
    pill.innerHTML = `
        <span style="font-weight:600; font-size:0.85rem;">${materia}</span>
        <button class="action-btn" onclick="abrirConteudoExtra('${materia}')">Conteúdos</button>
    `;
}

// 4. BUSCA O CSV DA MATÉRIA (ORDEM: TIPO, CONTEUDO, DATA) + CHECKBOXES
async function abrirConteudoExtra(materia) {
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').innerText = `Checklist: ${materia}`;
    document.getElementById('modal-info').innerHTML = `<p style="color:#888; font-size:0.8rem;">Marque o que já foi estudado:</p>`;
    
    try {
        const res = await fetch(`${materia}.csv`);
        const texto = await res.text();
        const linhas = texto.split(/\r?\n/).slice(1);
        
        let listaHtml = '<div class="scroll-container" style="max-height: 400px; overflow-y: auto; padding-right: 8px;">';
        
        // Recupera o estado dos checkboxes do LocalStorage
        const checksSalvos = JSON.parse(localStorage.getItem(`check_${materia}`)) || {};

        linhas.forEach((l, index) => {
            if(l.trim()) {
                // Lê na ordem que você pediu: Tipo, Conteudo, Data
                const [tipo, assunto, data] = l.split(',');
                const idUnico = `${materia}_${index}`;
                const isChecked = checksSalvos[idUnico] ? 'checked' : '';

                listaHtml += `
                    <div style="margin-bottom: 12px; border-bottom: 1px solid #222; padding-bottom: 10px; display: flex; align-items: flex-start; gap: 12px;">
                        <input type="checkbox" 
                               class="content-check" 
                               data-materia="${materia}" 
                               data-id="${idUnico}" 
                               ${isChecked} 
                               style="margin-top: 4px; width: 16px; height: 16px; cursor: pointer; accent-color: #fff;">
                        <div style="flex: 1;">
                            <div style="display:flex; justify-content: space-between; align-items: center;">
                                <code style="background:#252525; color:#fff; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px;">${tipo}</code>
                                <span style="color:#666; font-size: 0.75rem;">${data}</span>
                            </div>
                            <p style="margin: 4px 0 0 0; color:#ccc; font-size: 0.85rem; line-height: 1.4;">${assunto}</p>
                        </div>
                    </div>`;
            }
        });
        
        listaHtml += '</div>';
        document.getElementById('modal-notes').innerHTML = listaHtml;
        document.getElementById('modal-info').innerHTML = '';

        // Salva o estado do checkbox ao clicar
        document.querySelectorAll('.content-check').forEach(check => {
            check.addEventListener('change', (e) => {
                const mat = e.target.dataset.materia;
                const id = e.target.dataset.id;
                let currentChecks = JSON.parse(localStorage.getItem(`check_${mat}`)) || {};
                
                currentChecks[id] = e.target.checked;
                localStorage.setItem(`check_${mat}`, JSON.stringify(currentChecks));
            });
        });

    } catch (err) {
        document.getElementById('modal-notes').innerHTML = `<p style="color: #ff5555">Arquivo ${materia}.csv não encontrado.</p>`;
    }
    modal.style.display = 'flex';
}

// 5. INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    carregarCronograma();
    
    // Data no cabeçalho
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const dataTopo = new Date().toLocaleDateString('pt-BR', options);
    document.getElementById('current-date').innerText = `Hoje é ${dataTopo}`;

    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelector('.filter-btn.active').classList.remove('active');
            btn.classList.add('active');
            carregarCronograma(btn.dataset.filter);
        };
    });

    // Fechar Modal
    document.querySelector('.close-btn').onclick = () => document.getElementById('modal').style.display = 'none';
    window.onclick = (e) => { if(e.target.id === 'modal') document.getElementById('modal').style.display = 'none'; };
});