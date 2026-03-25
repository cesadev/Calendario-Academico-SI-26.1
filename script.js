let dadosOriginais = [];

async function carregarCronograma(filtro = 'all') {
    try {
        if (dadosOriginais.length === 0) {
            const response = await fetch('cronograma.csv');
            const data = await response.text();
            const linhas = data.split(/\r?\n/);
            
            dadosOriginais = linhas.slice(1).map(linha => {
                const col = linha.split(',');
                if (!linha || col.length < 3 || !linha.includes('/')) return null;
                return {
                    data: col[0]?.trim(),
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
        const hojeFormatado = new Date().toLocaleDateString('pt-BR');

        const dadosFiltrados = filtro === 'all' 
            ? dadosOriginais 
            : dadosOriginais.filter(item => item.disciplinas.includes(filtro));

        dadosFiltrados.forEach(item => {
            const tr = document.createElement('tr');
            if (item.data === hojeFormatado) tr.classList.add('today-highlight');
            const infoExtra = [item.contA, item.contB].filter(t => t.length > 0).join(' | ');

            tr.innerHTML = `
                <td>${item.data}</td>
                <td><strong>${item.dia}</strong></td>
                <td><span style="color:#fff; font-weight:600">${item.disciplinas}</span><br><small style="color:#888">${infoExtra}</small></td>
                <td><code style="color:var(--accent)">${item.lugar}</code></td>
            `;
            tr.onclick = () => abrirModal(item);
            tabelaBody.appendChild(tr);
        });

        atualizarPilulaInfo(filtro);

    } catch (e) { console.error(e); }
}

function atualizarPilulaInfo(materia) {
    const pill = document.getElementById('sub-menu');
    if (materia === 'all') {
        pill.style.display = 'none';
        return;
    }

    pill.style.display = 'flex';
    pill.innerHTML = `
        <span class="info-text">${materia}</span>
        <button class="action-btn" onclick="abrirConteudoExtra('${materia}')">Conteúdos</button>
    `;
}

async function abrirConteudoExtra(materia) {
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').innerText = `Conteúdos: ${materia}`;
    document.getElementById('modal-info').innerHTML = `<p>Carregando cronograma de ${materia}...</p>`;
    
    try {
        const res = await fetch(`${materia}.csv`);
        const texto = await res.text();
        const linhas = texto.split(/\r?\n/).slice(1);
        
        let listaHtml = '<ul style="text-align:left; font-size:0.9rem; color:#ccc; padding-left:20px;">';
        linhas.forEach(l => { if(l.trim()) listaHtml += `<li style="margin-bottom:8px;">${l.replace(/,/g, ' - ')}</li>`; });
        listaHtml += '</ul>';
        
        document.getElementById('modal-notes').innerHTML = listaHtml;
        document.getElementById('modal-info').innerHTML = '';
    } catch {
        document.getElementById('modal-notes').innerText = "Lista de conteúdos ainda não disponível.";
    }
    
    modal.style.display = 'flex';
}

function abrirModal(item) {
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').innerText = `${item.dia} - ${item.data}`;
    document.getElementById('modal-info').innerHTML = `<p><strong>Local:</strong> ${item.lugar}</p>`;
    document.getElementById('modal-notes').innerText = item.contA || "Sem observações.";
    modal.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', () => {
    carregarCronograma();
    const dataTopo = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('current-date').innerText = `Hoje é ${dataTopo}`;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelector('.filter-btn.active').classList.remove('active');
            btn.classList.add('active');
            carregarCronograma(btn.dataset.filter);
        };
    });
    document.querySelector('.close-btn').onclick = () => document.getElementById('modal').style.display = 'none';
    window.onclick = (e) => { if(e.target.id === 'modal') document.getElementById('modal').style.display = 'none'; };
});