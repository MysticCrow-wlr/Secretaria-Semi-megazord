import api from "@/api/axios";
import React, { useState, useEffect } from "react";
import PageLinksTwo from "../common/PageLinksTwo";
import FooterNine from "../layout/footers/FooterNine";
import EditIcon from '@mui/icons-material/Edit'; // Ícone de Editar (mui tava dando erro foi corrigido :D)
import DeleteIcon from '@mui/icons-material/Delete'; // Ícone de Deletar


// --- Novos importas ---
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Box,
  Grid,
  Typography, // Adicionado para títulos no modal
  Table,      // Adicionado para tabela de notas
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,      // Adicionado para container da tabela
  IconButton, // Adicionado para botões de editar/deletar na tabela
  Menu
} from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert'; // Implementamos: Ícone de Mais Opções
import HistoryIcon from '@mui/icons-material/History'; // Ícone para Histórico
import AssignmentIcon from '@mui/icons-material/Assignment'; // Ícone para Tarefas
import GradeIcon from '@mui/icons-material/Grade'; // Ícone para Notas

const tabs = [
  { id: 1, title: "Alunos" },
  { id: 2, title: "Responsaveis" },
  { id: 3, title: "Professores" },
  { id: 4, title: "Salas & Recursos" },
];

// --- Constante para CHOICES (Exemplo, preencha com seus valores) ---
const ADV_CHOICES = [
  { value: 'FJI', label: 'Faltas injustificadas' },
  { value: 'DSP', label: 'Desrespeito a colegas ou professores' },
  { value: 'CEL', label: 'Uso de celular sem autorização' },
  { value: 'RGR', label: 'Descumprimento das regras da escola' },
  { value: 'AGV', label: 'Agressões verbais' },
  { value: 'DPM', label: 'Dano leve ao patrimônio escolar' },
  { value: 'DOB', label: 'Desobediência a orientações' },
  { value: 'IND', label: 'Atos de indisciplina em sala' },
  { value: 'UNI', label: 'Uso inadequado do uniforme' },
  { value: 'CPM', label: 'Comportamento impróprio no ambiente escolar' },
  { value: 'LGF', label: 'Uso de linguagem ofensiva' },
  { value: 'FRA', label: 'Cola ou fraude em avaliações' },
  { value: 'BLG', label: 'Bullying ou assédio' },
  { value: 'OUTROS', label: 'Outros motivos' }
];
const SUSP_CHOICES = [
  { value: 'AGF', label: 'Agressão física a colegas ou funcionários' },
  { value: 'AME', label: 'Ameaças verbais ou físicas' },
  { value: 'BLG-R', label: 'Bullying recorrente ou grave' },
  { value: 'DSP-G', label: 'Desrespeito grave à autoridade escolar' },
  { value: 'VDM', label: 'Vandalismo / dano intencional ao patrimônio' },
  { value: 'SUB', label: 'Uso ou posse de substâncias proibidas' },
  { value: 'REC', label: 'Reincidência em comportamentos advertidos' },
  { value: 'IMP', label: 'Divulgação de conteúdo impróprio' },
  { value: 'RFT', label: 'Roubo ou furto na escola' },
  { value: 'BRG', label: 'Participação em brigas ou tumultos graves' },
  { value: 'RSC', label: 'Comportamento de risco à integridade física' },
  { value: 'PRG', label: 'Porte de armas ou objetos perigosos' },
  { value: 'FAL', label: 'Falsificação de documentos ou assinaturas' },
  { value: 'RES', label: 'Desrespeito extremo em ambiente escolar' },
  { value: 'SEG', label: 'Violação grave de normas de segurança' }
];
const DISCIPLINA_CHOICES = [
  { value: 'LING', label: 'Linguagens' },
  { value: 'CH', label: 'Ciências Humanas' },
  { value: 'CN', label: 'Ciências da Natureza' },
  { value: 'MAT', label: 'Matemática' },
  { value: 'DS', label: 'Itinerário técnico' },
];
const BIMESTRE_CHOICES = [
  { value: '1', label: '1º Bimestre' },
  { value: '2', label: '2º Bimestre' },
  { value: '3', label: '3º Bimestre' },
  { value: '4', label: '4º Bimestre' },
];
const STATUS_CHOICES = [
    { value: 'Pendente', label: 'Pendente', color: 'error.main' },
    { value: 'Em Andamento', label: 'Em Andamento', color: 'warning.main' },
    { value: 'Concluida', label: 'Concluída', color: 'success.main' },
];

// -----------------------------------------------------------------
// FUNÇÃO HELPER PARA PEGAR OS HEADERS DE AUTENTICAÇÃO
// -----------------------------------------------------------------
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.error("Token de autenticação não encontrado.");
    // Idealmente, redirecionar para login ou mostrar mensagem
    return null;
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// =================================================================
// Nova Adição: MENU DE AÇÕES DO ALUNO
// =================================================================
function AlunoActionMenu({ aluno, onEdit, onRemove, onOpenNotas, onOpenHistorico, onOpenTarefas }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleActionClick = (actionFunction, ...args) => {
    handleClose(); // Fecha o menu ao clicar
    actionFunction(...args);
  };

  return (
    <>
      {/* Botões de Ação Principal (Editar e Remover) */}
      <IconButton size="small" onClick={() => onEdit(aluno)} color="warning" sx={{ mr: 0.5 }}>
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={() => onRemove(aluno.id)} color="error" sx={{ mr: 1 }}>
        <DeleteIcon fontSize="small" />
      </IconButton>

      {/* Botão de Mais Opções */}
      <IconButton
        aria-label="mais ações"
        aria-controls={open ? 'aluno-action-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        size="small"
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      {/* Menu Dropdown */}
      <Menu
        id="aluno-action-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose} // Garante que feche mesmo se o item for um divisor ou algo sem ação
        PaperProps={{ style: { width: 220 } }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {/* Alternativa 1: Notas  */}
        <MenuItem onClick={() => handleActionClick(onOpenNotas, aluno)}>
          <GradeIcon fontSize="small" sx={{ mr: 1.5 }} />
          Notas
        </MenuItem>

        {/* Alternativa 2: Histórico */}
        <MenuItem onClick={() => handleActionClick(onOpenHistorico, aluno)}>
          <HistoryIcon fontSize="small" sx={{ mr: 1.5 }} />
          Histórico Disciplinar
        </MenuItem>

        {/* Alternativa 3: Tarefas Pendentes */}
        <MenuItem onClick={() => handleActionClick(onOpenTarefas, aluno)}>
          <AssignmentIcon fontSize="small" sx={{ mr: 1.5 }} />
          Tarefas Pendentes
        </MenuItem>
      </Menu>
    </>
  );
}

// =================================================================
// PAINEL DE ALUNOS (Com Action Menu integrado)
// =================================================================
function AlunoAdminPanel() {
  const [alunos, setAlunos] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]); // Mantemos o estado para o Modal
  const [loadingAlunos, setLoadingAlunos] = useState(true);
  const [loadingResponsaveis, setLoadingResponsaveis] = useState(false);
  const [modalOpen, setModalOpen] = useState(false); // Modal de Adicionar/Editar Aluno
  const [editingAluno, setEditingAluno] = useState(null);
  const [filters, setFilters] = useState({ nome: "", cpf: "", turma: "" });
  const [notasModalOpen, setNotasModalOpen] = useState(false); // Estado do Modal de Notas
  const [viewingNotasAluno, setViewingNotasAluno] = useState(null); // Aluno para o Modal de Notas
  
  // --- Estado do historico ---
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);
  const [viewingHistoricoAluno, setViewingHistoricoAluno] = useState(null);
  // Acaba

  // --- Adição de estado de tarefas pendente ---
  const [tarefasModalOpen, setTarefasModalOpen] = useState(false);
  const [viewingTarefasAluno, setViewingTarefasAluno] = useState(null);
  // Acaba

  const fetchResponsaveis = async () => {
    setLoadingResponsaveis(true); const headers = getAuthHeaders(); if (!headers) { setLoadingResponsaveis(false); return; }
    try { const res = await api.get("/responsaveis/", { headers }); setResponsaveis(Array.isArray(res.data) ? res.data : res.data.results || []); }
    catch (error) { console.error("Erro ao buscar responsáveis:", error.response?.data || error); setResponsaveis([]); }
    finally { setLoadingResponsaveis(false); }
  };
  const fetchAlunos = async () => {
    setLoadingAlunos(true); const headers = getAuthHeaders(); if (!headers) { setLoadingAlunos(false); return; }
    try { const res = await api.get("/alunos/", { headers }); setAlunos(Array.isArray(res.data) ? res.data : res.data.results || []); }
    catch (error) { console.error("Erro ao buscar alunos:", error.response?.data || error); if (error.response?.status === 403) alert("Sem permissão."); setAlunos([]); }
    finally { setLoadingAlunos(false); }
  };
  useEffect(() => { fetchAlunos(); fetchResponsaveis(); }, []);
  const handleFilterChange = (e) => { setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })); };
  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza?")) return; const headers = getAuthHeaders(); if (!headers) return;
    try { await api.delete(`/alunos/${id}/`, { headers }); alert("Removido!"); fetchAlunos(); }
    catch (error) { console.error("Erro:", error.response?.data); alert("Erro."); }
  };
  
  // --- Função de controle de modal e formulario ---
  const handleOpenCreateModal = async () => { await fetchResponsaveis(); setEditingAluno(null); setModalOpen(true); };
  const handleOpenEditModal = async (aluno) => { await fetchResponsaveis(); setEditingAluno(aluno); setModalOpen(true); };
  const handleCloseModal = () => { setModalOpen(false); setEditingAluno(null); };
  const handleFormSubmit = async (formData) => {
    const headers = getAuthHeaders(); if (!headers) return; const payload = { ...formData, responsavel: formData.responsavel === "" ? null : formData.responsavel };
    try { if (editingAluno) await api.put(`/alunos/${editingAluno.id}/`, payload, { headers }); else await api.post("/alunos/", payload, { headers }); alert("Salvo!"); handleCloseModal(); fetchAlunos(); }
    catch (error) { console.error("Erro:", error.response?.data); alert("Erro."); }
  };
  // acaba aqui
  
  // Funções de Ação do Menu (Notas)
  const handleOpenNotasModal = (aluno) => { setViewingNotasAluno(aluno); setNotasModalOpen(true); };
  const handleCloseNotasModal = () => { setNotasModalOpen(false); setViewingNotasAluno(null); };
  
  // --- handler do historico ---
  const handleOpenHistoricoModal = (aluno) => { 
    setViewingHistoricoAluno(aluno); 
    setHistoricoModalOpen(true); 
  };
  const handleCloseHistoricoModal = () => {
    setHistoricoModalOpen(false);
    setViewingHistoricoAluno(null);
  };
  // acaba aqui

  // --- novo handler de tarefa pendente ---
  const handleOpenTarefasModal = (aluno) => {
    setViewingTarefasAluno(aluno);
    setTarefasModalOpen(true);
 };
  const handleCloseTarefasModal = () => {
    setTarefasModalOpen(false);
    setViewingTarefasAluno(null);
 };
// acaba aqui

  
  
  const filteredAlunos = alunos.filter(aluno =>
      (aluno.name_aluno?.toLowerCase().includes(filters.nome.toLowerCase())) &&
      (aluno.cpf_aluno?.includes(filters.cpf)) &&
      (filters.turma === "" || aluno.class_choice === filters.turma)
  );

  return (
    <div>
      <h3 className="mb-20">Gerenciar Alunos</h3>
       <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
         <Grid container spacing={2}>
           <Grid item xs={12} sm={4}><TextField fullWidth label="Filtrar por Nome" name="nome" value={filters.nome} onChange={handleFilterChange} variant="outlined" size="small" /></Grid>
           <Grid item xs={12} sm={4}><TextField fullWidth label="Filtrar por CPF" name="cpf" value={filters.cpf} onChange={handleFilterChange} variant="outlined" size="small" /></Grid>
           <Grid item xs={12} sm={4}><TurmaSelect value={filters.turma} onChange={handleFilterChange} name="turma" label="Filtrar por Turma" fullWidth /></Grid>
         </Grid>
         <Box ml={2} flexShrink={0}><Button variant="contained" color="primary" onClick={handleOpenCreateModal}>Adicionar Aluno</Button></Box>
       </Box>
      <table className="table table-bordered">
        <thead><tr><th>Nome</th><th>Email</th><th>CPF</th><th>Turma</th><th>Responsável</th><th>Faltas</th><th>Ações</th></tr></thead>
        <tbody>
          {loadingAlunos ? (<tr><td colSpan="7">Carregando alunos...</td></tr>) : filteredAlunos.map(aluno => (
            <tr key={aluno.id}>
              <td>{aluno.name_aluno}</td><td>{aluno.email_aluno}</td><td>{aluno.cpf_aluno}</td><td>{aluno.class_choice}</td>
              {/* Correção para usar responsavel_nome */}
              <td>{aluno.responsavel_nome || "N/D"}</td>

              <td>{aluno.faltas_aluno}</td>
              <td style={{ minWidth: '150px' }}> {/* Adiciona largura mínima para o menu caber */}
                <AlunoActionMenu
                  aluno={aluno}
                  onEdit={handleOpenEditModal}
                  onRemove={handleDelete}
                  onOpenNotas={handleOpenNotasModal}
                  onOpenHistorico={handleOpenHistoricoModal} // Chamada para o handler CORRETO
                  onOpenTarefas={handleOpenTarefasModal}
                />
              </td></tr>
          ))}
        </tbody>
      </table>
      {/* Modal de Aluno (Adicionar/Editar) */}
      <AlunoFormModal key={editingAluno ? `edit-${editingAluno.id}` : 'create'} open={modalOpen} onClose={handleCloseModal} onSubmit={handleFormSubmit} aluno={editingAluno} responsaveis={responsaveis} />
      {/* Modal de Notas */}
      {viewingNotasAluno && ( <AlunoNotasModal key={`notas-${viewingNotasAluno.id}`} open={notasModalOpen} onClose={handleCloseNotasModal} aluno={viewingNotasAluno} /> )}
      {/* --- Adição de novo modal historico --- */}
      {viewingHistoricoAluno && ( <AlunoHistoricoModal key={`hist-${viewingHistoricoAluno.id}`} open={historicoModalOpen} onClose={handleCloseHistoricoModal} aluno={viewingHistoricoAluno} /> )}
      {/* --- Adição de novo modal de tarefa pendente */}
      {viewingTarefasAluno && ( <AlunoTarefasModal key={`tarefas-${viewingTarefasAluno.id}`} open={tarefasModalOpen} onClose={handleCloseTarefasModal} aluno={viewingTarefasAluno} /> )}
    </div>
  );
}

// =================================================================
// MODAL DO FORMULÁRIO DE ALUNO
// =================================================================
function AlunoFormModal({ open, onClose, onSubmit, aluno, responsaveis }) {
    const initialFormState = { 
        name_aluno: "", phone_number_aluno: "", email_aluno: "", cpf_aluno: "", birthday_aluno: "", 
        class_choice: "", month_choice: "", responsavel: null, 
        faltas_aluno: 0, // Mudamos para 0
        presencas_aluno: 0,
        ano_letivo: new Date().getFullYear() 
    };
    const [form, setForm] = useState(initialFormState);

    useEffect(() => {
        if (open) { 
            if (aluno) {
                const formattedBirthday = aluno.birthday_aluno ? aluno.birthday_aluno.split('/').reverse().join('-') : "";
                const responsavelId = typeof aluno.responsavel === 'object' ? aluno.responsavel.id : aluno.responsavel;
                
                setForm({ 
                    ...aluno, 
                    birthday_aluno: formattedBirthday, 
                    responsavel: responsavelId || null,
                    // Garante que os novos campos estejam no formulário, mesmo que sejam null/undefined
                });
            } else {
                setForm(initialFormState);
            }
        }
    }, [aluno, open]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        
        let finalValue = value;

        if (type === 'number') {
            finalValue = Number(value);
        } else if (name === "responsavel") {
            finalValue = value === "" ? null : Number(value);
        }

        setForm(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{aluno ? "Editar Aluno" : "Adicionar Novo Aluno"}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2} mt={1}>
                        <Grid item xs={12} sm={6}><TextField name="name_aluno" label="Nome do Aluno" value={form.name_aluno} onChange={handleChange} fullWidth required /></Grid>
                        <Grid item xs={12} sm={6}><TextField name="phone_number_aluno" label="Telefone" value={form.phone_number_aluno} onChange={handleChange} fullWidth /></Grid>
                        <Grid item xs={12} sm={6}><TextField name="email_aluno" label="Email" type="email" value={form.email_aluno} onChange={handleChange} fullWidth /></Grid>
                        <Grid item xs={12} sm={6}><TextField name="cpf_aluno" label="CPF" value={form.cpf_aluno} onChange={handleChange} fullWidth required /></Grid>
                        <Grid item xs={12} sm={6}><TextField name="birthday_aluno" label="Data de Nascimento" value={form.birthday_aluno} onChange={handleChange} type="date" fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                        
                        {/* Linha de Informações Escolares */}
                        <Grid item xs={12} sm={4}><TurmaSelect value={form.class_choice} onChange={handleChange} name="class_choice" label="Turma" /></Grid>
                        <Grid item xs={12} sm={4}><MesSelect value={form.month_choice} onChange={handleChange} /></Grid>
                        <Grid item xs={12} sm={4}><TextField name="ano_letivo" label="Ano Letivo" type="number" value={form.ano_letivo} onChange={handleChange} fullWidth /></Grid>
                        
                        {/* Adicionamos novo campos de frequencia */}
                        <Grid item xs={12} sm={4}><TextField name="faltas_aluno" label="Faltas" type="number" value={form.faltas_aluno} onChange={handleChange} fullWidth /></Grid>
                        <Grid item xs={12} sm={4}><TextField name="presencas_aluno" label="Presenças" type="number" value={form.presencas_aluno} onChange={handleChange} fullWidth /></Grid>
                        
                        {/* Seleção do Responsável */}
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Responsável</InputLabel>
                                <Select name="responsavel" label="Responsável" value={form.responsavel === null ? "" : form.responsavel} onChange={handleChange}>
                                    <MenuItem value=""><em>Nenhum</em></MenuItem>
                                    {responsaveis.map(r => (<MenuItem key={r.id} value={r.id}>{r.name || `ID: ${r.id}`}</MenuItem>))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                    </Grid>
                </DialogContent>
                <DialogActions><Button onClick={onClose}>Cancelar</Button><Button type="submit" variant="contained">Salvar</Button></DialogActions>
            </form>
        </Dialog>
    );
}
function AlunoNotasModal({ open, onClose, aluno }) {
    const [notas, setNotas] = useState([]);
    const [bimestresApi, setBimestresApi] = useState([]);
    const [loadingNotas, setLoadingNotas] = useState(false);
    const [loadingBimestres, setLoadingBimestres] = useState(false);
    
    const [selectedBimestreId, setSelectedBimestreId] = useState(null);
    const [notasEmEdicao, setNotasEmEdicao] = useState([]); 
    
    // Funções de busca 
    const fetchDataForModal = async () => {
        if (!aluno?.id) return;
        setLoadingNotas(true);
        setLoadingBimestres(true); 
        const headers = getAuthHeaders();
        if (!headers) {
            setLoadingNotas(false);
            setLoadingBimestres(false);
            return;
        }
        try {
            const [notasRes, bimestresRes] = await Promise.allSettled([
                api.get(`/notas/?aluno=${aluno.id}`, { headers }),
                api.get('/bimestres/', { headers })
            ]);

            if (notasRes.status === 'fulfilled') {
                setNotas(Array.isArray(notasRes.value.data) ? notasRes.value.data : notasRes.value.data.results || []);
            }
            if (bimestresRes.status === 'fulfilled') {
                setBimestresApi(Array.isArray(bimestresRes.value.data) ? bimestresRes.value.data : bimestresRes.value.data.results || []);
            }
        } catch (error) { console.error("Erro inesperado ao buscar dados:", error); } 
        finally {
            setLoadingNotas(false);
            setLoadingBimestres(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchDataForModal();
            setSelectedBimestreId(null); 
        }
    }, [open, aluno]); 

    useEffect(() => {
        if (selectedBimestreId && !loadingNotas) {
            setNotasEmEdicao(getNotasIniciaisParaEdicao(selectedBimestreId));
        }
    }, [selectedBimestreId, notas, loadingNotas]); 

    const getNotasIniciaisParaEdicao = (bimestreId) => {
        const notasDoBimestre = notas.filter(nota => nota.bimestre == bimestreId);
        
        return DISCIPLINA_CHOICES.map(disciplina => {
            const notaExistente = notasDoBimestre.find(n => n.disciplina === disciplina.value);
            return {
                disciplina: disciplina.value,
                disciplinaLabel: disciplina.label,
                id: notaExistente?.id || null, 
                valor: notaExistente?.valor || '',
            };
        });
    };

    const handleValorChange = (disciplina, novoValor) => {
        const valorNumerico = novoValor === '' ? '' : Math.max(0, Math.min(10, parseFloat(novoValor)));
        
        setNotasEmEdicao(prev =>
            prev.map(item =>
                item.disciplina === disciplina
                    ? { ...item, valor: valorNumerico }
                    : item
            )
        );
    };

    const handleSaveBimestre = async () => {
        if (!selectedBimestreId) return alert("Erro: Bimestre não selecionado.");
        setLoadingNotas(true);
        const headers = getAuthHeaders();
        
        const operacoes = notasEmEdicao.map(item => {
            if (item.valor === '' && !item.id) return null; 

            const payload = {
                aluno: aluno.id,
                bimestre: selectedBimestreId,
                disciplina: item.disciplina,
                valor: item.valor === '' ? 0 : item.valor 
            };

            if (item.id) {
                return api.put(`/notas/${item.id}/`, payload, { headers });
            } else if (item.valor !== '') {
                return api.post("/notas/", payload, { headers });
            }
            return null;
        }).filter(op => op !== null); 
        
        try {
            await Promise.allSettled(operacoes);
            alert(`Notas do ${getBimestreLabel(selectedBimestreId)}º Bimestre salvas/atualizadas com sucesso!`);
            fetchDataForModal(); 
        } catch (error) {
            console.error("Erro ao salvar notas:", error.response?.data || error);
            alert("Erro ao salvar as notas. Verifique se não há duplicidade de bimestres/disciplinas.");
        } finally {
            setLoadingNotas(false);
        }
    };
    
    const getBimestreLabel = (bimestreId) => {
        const id = Number(bimestreId); 
        const bimestreObj = bimestresApi.find(b => Number(b.id) === id); 
        return bimestreObj ? `${bimestreObj.numero}º Bimestre` : `ID Desconhecido: ${id}`;
    };

    // -------------------------------------------------------------
    // RENDERIZAÇÃO
    // -------------------------------------------------------------
    
    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>Notas do Aluno: {aluno?.name_aluno || "Carregando..."}</DialogTitle>
            <DialogContent>
                
                {/* NOVO BLOCO DE EDIÇÃO POR BIMESTRE*/}
                <Box mb={4} border={1} borderColor="grey.300" borderRadius={1} p={2}>
                    <Typography variant="h6" gutterBottom>Editar Notas por Bimestre</Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small" disabled={loadingBimestres}>
                                <InputLabel>Bimestre</InputLabel>
                                <Select 
                                    label="Bimestre" 
                                    value={selectedBimestreId || ""} 
                                    onChange={(e) => setSelectedBimestreId(Number(e.target.value))}
                                >
                                    <MenuItem value=""><em>{loadingBimestres ? "Carregando..." : "Selecione o Bimestre"}</em></MenuItem>
                                    {bimestresApi.map(b => (
                                        <MenuItem key={b.id} value={b.id}>{getBimestreLabel(b.id)}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={8}>
                            {selectedBimestreId && (
                                <Button 
                                    variant="contained" 
                                    color="primary"
                                    onClick={handleSaveBimestre} 
                                    disabled={loadingNotas}
                                >
                                    {loadingNotas ? 'Salvando...' : `Salvar Notas do ${getBimestreLabel(selectedBimestreId)}`}
                                </Button>
                            )}
                        </Grid>
                    </Grid>

                    {selectedBimestreId && (
                        <Box mt={3}>
                            <TableContainer component={Paper}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                                            <TableCell>Disciplina</TableCell>
                                            <TableCell>Nota (0-10)</TableCell>
                                            <TableCell>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {notasEmEdicao.map((item) => (
                                            <TableRow key={item.disciplina}>
                                                <TableCell>{item.disciplinaLabel}</TableCell>
                                                <TableCell>
                                                    <TextField 
                                                        type="number" 
                                                        size="small" 
                                                        value={item.valor}
                                                        onChange={(e) => handleValorChange(item.disciplina, e.target.value)}
                                                        inputProps={{ step: "0.01", min: "0", max: "10" }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography color={item.id ? 'success.main' : 'warning.main'} variant="body2">
                                                        {item.id ? 'Registrada' : (item.valor !== '' ? 'A Enviar' : 'Pendente')}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </Box>
                
                {/* Você pode manter o histórico completo ou removê-lo completamente daqui */}

            </DialogContent>
            <DialogActions><Button onClick={onClose}>Fechar</Button></DialogActions>
        </Dialog>
    );
}

// =================================================================
// MODAL PARA VISUALIZAR HISTÓRICO DISCIPLINAR (Advertências e Suspensões)
// =================================================================
function HistoricoFormModal({ open, onClose, alunoId, onSave }) {
    const initialForm = {
        tipo: 'Advertencia', // Começa com Advertência
        data: new Date().toISOString().split('T')[0], // Data de hoje (YYYY-MM-DD)
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: new Date().toISOString().split('T')[0],
        motivo: '',
        observacao: '',
    };
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [saveError, setSaveError] = useState(null);

    const isSuspensao = form.tipo === 'Suspensao';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleTipoChange = (e) => {
        const novoTipo = e.target.value;
        setForm(initialForm); // Reseta o formulário, mas mantém a data atual
        setForm(prev => ({ 
            ...prev, 
            tipo: novoTipo,
            data: novoTipo === 'Advertencia' ? prev.data : null,
            data_inicio: novoTipo === 'Suspensao' ? prev.data_inicio : null,
            data_fim: novoTipo === 'Suspensao' ? prev.data_fim : null,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSaveError(null);
        const headers = getAuthHeaders();
        if (!headers) { setLoading(false); return; }

        const endpoint = isSuspensao ? '/suspensoes/' : '/advertencias/';
        
        // Constrói o payload com base no tipo
        const payload = isSuspensao ? {
            aluno: alunoId,
            data_inicio: form.data_inicio,
            data_fim: form.data_fim,
            motivo: form.motivo,
            observacao: form.observacao
        } : {
            aluno: alunoId,
            data: form.data,
            motivo: form.motivo,
            observacao: form.observacao
        };

        try {
            await api.post(endpoint, payload, { headers });
            alert(`${isSuspensao ? 'Suspensão' : 'Advertência'} registrada com sucesso!`);
            onSave(); // Chama a função para fechar e recarregar o histórico principal
        } catch (error) {
            console.error("Erro ao salvar registro disciplinar:", error.response?.data);
            setSaveError(error.response?.data ? JSON.stringify(error.response.data) : "Erro de comunicação.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Novo Registro Disciplinar para {alunoId}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2} mt={1}>
                        {/* 1. Selecionar Tipo de Registro */}
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Tipo de Registro</InputLabel>
                                <Select name="tipo" label="Tipo de Registro" value={form.tipo} onChange={handleTipoChange}>
                                    <MenuItem value="Advertencia">Advertência</MenuItem>
                                    <MenuItem value="Suspensao">Suspensão</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* 2. Seleção de Motivo (Muda com base no Tipo) */}
                        <Grid item xs={12}>
                             <FormControl fullWidth>
                                <InputLabel>Motivo</InputLabel>
                                <Select name="motivo" label="Motivo" value={form.motivo} onChange={handleChange} required>
                                    <MenuItem value=""><em>Selecione o Motivo</em></MenuItem>
                                    {(isSuspensao ? SUSP_CHOICES : ADV_CHOICES).map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* 3. Campos de Data (Dependentes do Tipo) */}
                        {isSuspensao ? (
                            <>
                                <Grid item xs={6}>
                                    <TextField name="data_inicio" label="Data de Início" value={form.data_inicio} onChange={handleChange} type="date" fullWidth InputLabelProps={{ shrink: true }} required />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField name="data_fim" label="Data de Fim" value={form.data_fim} onChange={handleChange} type="date" fullWidth InputLabelProps={{ shrink: true }} required />
                                </Grid>
                            </>
                        ) : (
                             <Grid item xs={12}>
                                <TextField name="data" label="Data da Advertência" value={form.data} onChange={handleChange} type="date" fullWidth InputLabelProps={{ shrink: true }} required />
                             </Grid>
                        )}
                        
                        {/* 4. Observações */}
                        <Grid item xs={12}>
                            <TextField name="observacao" label="Observações" value={form.observacao} onChange={handleChange} multiline rows={3} fullWidth />
                        </Grid>

                        {/* 5. Feedback de Erro */}
                        {saveError && (
                            <Grid item xs={12}>
                                <Typography color="error" variant="body2">
                                    Erro de Validação: {saveError}
                                </Typography>
                            </Grid>
                        )}

                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button type="submit" variant="contained" color="primary" disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar Registro'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

// =================================================================
// MODAL PARA VISUALIZAR HISTÓRICO DISCIPLINAR (Advertências e Suspensões)
// =================================================================
function AlunoHistoricoModal({ open, onClose, aluno }) {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Adicionamos novo modal: Controla o modal de adição
  const [formModalOpen, setFormModalOpen] = useState(false);

  const fetchData = async () => {
    if (!aluno?.id) return;
    setLoading(true);
    setError(null);
    const headers = getAuthHeaders();
    if (!headers) {
        setLoading(false);
        return;
    }

    try {
        // CORREÇÃO: Adicionando o filtro do aluno diretamente na query string da API
        const [advRes, suspRes] = await Promise.allSettled([
            api.get(`/advertencias/?aluno=${aluno.id}`, { headers }),
            api.get(`/suspensoes/?aluno=${aluno.id}`, { headers }),
        ]);

        let combinedList = [];

        // Processa Advertências
        if (advRes.status === 'fulfilled') {
            const rawData = advRes.value.data.results || advRes.value.data;
            const data = Array.isArray(rawData) ? rawData : [];

            // O filtro no frontend (data.filter(item => item.aluno == aluno.id))  foi removido
            const advertencias = data.map(item => ({
                ...item,
                tipo: 'Advertência',
                data: item.data, 
                motivoLabel: ADV_CHOICES.find(opt => opt.value === item.motivo)?.label || item.motivo,
                dataFim: null,
            }));
            
            combinedList = combinedList.concat(advertencias);
        } else {
            console.error("Erro ao buscar advertências:", advRes.reason);
            setError("Erro ao carregar advertências.");
        }

        // Processa Suspensões
        if (suspRes.status === 'fulfilled') {
            const rawData = suspRes.value.data.results || suspRes.value.data;
            const data = Array.isArray(rawData) ? rawData : [];
            
            // O filtro no frontend (data.filter(item => item.aluno == aluno.id)) foi removido
           
            const suspensoes = data.map(item => ({
                ...item,
                tipo: 'Suspensão',
                data: item.data_inicio, 
                motivoLabel: SUSP_CHOICES.find(opt => opt.value === item.motivo)?.label || item.motivo,
                dataFim: item.data_fim,
            }));

            combinedList = combinedList.concat(suspensoes);
        } else {
            console.error("Erro ao buscar suspensões:", suspRes.reason);
            setError("Erro ao carregar suspensões.");
        }

        // Ordena cronologicamente (do mais recente para o mais antigo)
        combinedList.sort((a, b) => new Date(b.data) - new Date(a.data));

        setHistorico(combinedList);

    } catch (err) {
        console.error("Erro inesperado na busca do histórico:", err);
        setError("Erro de comunicação com a API.");
    } finally {
        setLoading(false);
    }
};

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, aluno]);
  
  // HANDLERS DO MODAL DE FORMULÁRIO 
  const handleOpenFormModal = () => {
      setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
      setFormModalOpen(false);
  };
  
  const handleRecordSaved = () => {
      handleCloseFormModal(); // Fecha o modal de formulário
      fetchData(); // Recarrega o histórico principal
  };
  // -------------------------------------


  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Histórico Disciplinar do Aluno: {aluno?.name_aluno || "..."}</DialogTitle>
      <DialogContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" gutterBottom>
              Eventos Disciplinares Registrados
            </Typography>
            <Button 
                variant="contained" 
                color="primary" 
                size="small" 
                onClick={handleOpenFormModal} // Botão para abrir o formulário
            >
                Adicionar Registro
            </Button>
        </Box>

        {loading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>Carregando histórico...</Box>
        ) : error ? (
          <Box sx={{ p: 3, color: 'error.main', textAlign: 'center' }}>{error}</Box>
        ) : historico.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', border: '1px solid #eee' }}>Nenhum registro disciplinar encontrado.</Box>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                  <TableCell>Data Início</TableCell>
                  <TableCell>Data Fim</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Motivo</TableCell>
                  <TableCell>Observações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historico.map((item) => (
                  <TableRow key={`${item.tipo}-${item.id}`} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                        {item.data ? new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/D'}
                    </TableCell>
                    <TableCell>
                        {item.dataFim ? new Date(item.dataFim).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '---'}
                    </TableCell>
                    <TableCell>
                        <Typography variant="body2" color={item.tipo === 'Advertência' ? 'warning.main' : 'error.main'} fontWeight="bold">
                            {item.tipo}
                        </Typography>
                    </TableCell>
                    <TableCell>{item.motivoLabel}</TableCell>
                    <TableCell>{item.observacao || '---'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
      
      {/*RENDERIZAÇÃO DO MODAL DE CRIAÇÃO */}
      <HistoricoFormModal
          open={formModalOpen}
          onClose={handleCloseFormModal}
          alunoId={aluno?.id}
          onSave={handleRecordSaved}
      />
      {/* -------------------------------------- */}
      
    </Dialog>
  );
}

// =================================================================
// MODAL DO FORMULÁRIO DE SALA (Adicionar/Editar)
// =================================================================
function SalaFormModal({ open, onClose, onSubmit, sala = null }) {
    // Choices para o formulário (baseado no models.py)
    const TIPO_CHOICES_UI = [
        { value: 'SALA', label: 'Sala de Aula' },
        { value: 'LAB', label: 'Laboratório' },
        { value: 'QUADRA', label: 'Quadra/Esporte' },
    ];
    
    const initialFormState = { nome: "", tipo: 'SALA', capacidade: 30, recursos: "" };
    const [form, setForm] = useState(initialFormState);
    const isEdit = !!sala;

    useEffect(() => {
        if (open) { 
            setForm(isEdit ? { ...sala } : initialFormState);
        }
    }, [sala, open, isEdit]);

    const handleChange = (e) => { 
        const { name, value } = e.target;
        const finalValue = name === "capacidade" ? Number(value) : value;
        setForm(prev => ({ ...prev, [name]: finalValue })); 
    };
    const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{isEdit ? "Editar Sala" : "Adicionar Nova Sala"}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2} mt={1}>
                        <Grid item xs={12}><TextField name="nome" label="Nome da Sala (Ex: Sala 101)" value={form.nome} onChange={handleChange} fullWidth required size="small" /></Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required size="small">
                                <InputLabel>Tipo</InputLabel>
                                <Select name="tipo" label="Tipo" value={form.tipo} onChange={handleChange}>
                                    {TIPO_CHOICES_UI.map(opt => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField name="capacidade" label="Capacidade" type="number" value={form.capacidade} onChange={handleChange} fullWidth required size="small" inputProps={{ min: 1 }} />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField name="recursos" label="Recursos" value={form.recursos} onChange={handleChange} fullWidth multiline rows={3} size="small" placeholder="Ex: Projetor, Ar Condicionado, 20 Cadeiras" />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions><Button onClick={onClose}>Cancelar</Button><Button type="submit" variant="contained">Salvar Sala</Button></DialogActions>
            </form>
        </Dialog>
    );
}

// EM: Administration.jsx (ADICIONE ESTE BLOCO)
// =================================================================
// PAINEL DE GERENCIAMENTO DE SALAS (ADMINISTRAÇÃO)
// =================================================================
function SalaAdminPanel() {
    // 💡 A Secretaria tem permissão total (CRUD)
    
    const [salas, setSalas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSala, setEditingSala] = useState(null);
    const [filters, setFilters] = useState({ nome: "" });

    const fetchData = async () => {
        setLoading(true);
        const headers = getAuthHeaders(); if (!headers) { setLoading(false); return; }
        try {
            // Rota: /api/salas/
            const res = await api.get("/salas/", { headers }); 
            setSalas(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (error) {
            console.error("Erro ao buscar salas:", error);
            alert("Erro ao carregar salas. Verifique se a rota /api/salas/ está configurada.");
            setSalas([]);
        } finally { setLoading(false); }
    };
    
    useEffect(() => { fetchData(); }, []);
    
    const handleFilterChange = (e) => { setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })); };
    
    const handleOpenCreateModal = () => { setEditingSala(null); setModalOpen(true); };
    const handleOpenEditModal = (sala) => { setEditingSala(sala); setModalOpen(true); };
    const handleCloseModal = () => { setModalOpen(false); setEditingSala(null); fetchData(); };
    
    const handleFormSubmit = async (formData) => {
        const headers = getAuthHeaders(); if (!headers) return;
        try {
            if (editingSala) await api.put(`/salas/${editingSala.id}/`, formData, { headers });
            else await api.post("/salas/", formData, { headers });
            alert("Sala salva com sucesso!"); handleCloseModal();
        } catch (error) { console.error("Erro ao salvar sala:", error.response?.data); alert("Erro ao salvar sala (Nome duplicado?)."); }
    };
    
    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que quer remover esta sala?")) return;
        const headers = getAuthHeaders(); if (!headers) return;
        try { await api.delete(`/salas/${id}/`, { headers }); alert("Sala removida!"); fetchData(); }
        catch (error) { console.error("Erro ao remover sala:", error.response?.data); alert("Erro ao remover sala."); }
    };

    const filteredSalas = salas.filter(sala =>
        (sala.nome?.toLowerCase().includes(filters.nome.toLowerCase()))
    );

    return (
        <div>
            <h3 className="mb-20">Gerenciar Salas e Recursos</h3>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Filtrar por Nome" name="nome" value={filters.nome} onChange={handleFilterChange} variant="outlined" size="small" />
                    </Grid>
                </Grid>
                <Box ml={2} flexShrink={0}>
                    <Button variant="contained" color="primary" onClick={handleOpenCreateModal}>Adicionar Sala</Button>
                </Box>
            </Box>
            <table className="table table-bordered">
                <thead><tr><th>Nome</th><th>Tipo</th><th>Capacidade</th><th>Recursos</th><th>Ações</th></tr></thead>
                <tbody>
                    {loading ? (<tr><td colSpan="5">Carregando salas...</td></tr>) : filteredSalas.map(sala => (
                        <tr key={sala.id}>
                            <td>{sala.nome}</td>
                            <td>{sala.tipo}</td>
                            <td>{sala.capacidade}</td>
                            <td>{sala.recursos}</td>
                            <td>
                                <button className="btn btn-sm btn-warning mr-5" onClick={() => handleOpenEditModal(sala)}>Editar</button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(sala.id)}>Remover</button>
                            </td></tr>
                    ))}
                </tbody>
            </table>
            <SalaFormModal key={editingSala ? `sala-edit-${editingSala.id}` : 'sala-create'} open={modalOpen} onClose={handleCloseModal} onSubmit={handleFormSubmit} sala={editingSala} />
        </div>
    );
}

// =================================================================
// PAINEL DE RESPONSÁVEIS (Refatorado + Nomes de Campo CORRIGIDOS)
// =================================================================
function ResponsavelAdminPanel() {
  const [responsaveis, setResponsaveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingResponsavel, setEditingResponsavel] = useState(null);
  const [filters, setFilters] = useState({ nome: "", cpf: "" });

  const fetchData = async () => {
    setLoading(true);
    const headers = getAuthHeaders();
    if (!headers) { setLoading(false); return; }
    try {
      const res = await api.get("/responsaveis/", { headers });
       // Garante que é um array
      setResponsaveis(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (error) {
      console.error("Erro ao buscar responsáveis:", error);
      if (error.response?.status === 403) alert("Você não tem permissão para carregar a lista de responsáveis.");
      setResponsaveis([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  const handleFilterChange = (e) => { setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })); };
  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que quer remover este responsável?")) return;
    const headers = getAuthHeaders(); if (!headers) return;
    try { await api.delete(`/responsaveis/${id}/`, { headers }); alert("Responsável removido com sucesso!"); fetchData(); }
    catch (error) { console.error("Erro ao remover o responsável:", error.response?.data); alert("Erro ao remover o responsável."); }
  };
  const handleOpenCreateModal = () => { setEditingResponsavel(null); setModalOpen(true); };
  const handleOpenEditModal = (resp) => { setEditingResponsavel(resp); setModalOpen(true); };
  const handleCloseModal = () => { setModalOpen(false); setEditingResponsavel(null); };
  const handleFormSubmit = async (formData) => {
    const headers = getAuthHeaders(); if (!headers) return;
    try {
      if (editingResponsavel) await api.put(`/responsaveis/${editingResponsavel.id}/`, formData, { headers });
      else await api.post("/responsaveis/", formData, { headers });
      alert("Responsável salvo com sucesso!"); handleCloseModal(); fetchData();
    } catch (error) {
      if (error.response?.status === 400) {
        console.error("Erro de validação ao salvar o responsável:", error.response?.data);
        alert("Erro ao salvar: Verifique os dados do formulário (campos obrigatórios, formato inválido, CPF duplicado?).");
      } else {
        console.error("Erro ao salvar o responsável:", error.response?.data);
        alert("Erro ao salvar o responsável.");
      }
    }
  };

  // CORREÇÃO : movemos a linha para antes do return ---
  const filteredResponsaveis = responsaveis.filter(resp => (
      (resp.name?.toLowerCase().includes(filters.nome.toLowerCase())) && // usa 'name'
      (resp.cpf?.includes(filters.cpf))                                // usa 'cpf'
  ));

  return (
    <div>
      <h3 className="mb-20">Gerenciar Responsáveis</h3>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Filtrar por Nome" name="nome" value={filters.nome} onChange={handleFilterChange} variant="outlined" size="small" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Filtrar por CPF" name="cpf" value={filters.cpf} onChange={handleFilterChange} variant="outlined" size="small" /></Grid>
        </Grid>
        <Box ml={2} flexShrink={0}><Button variant="contained" color="primary" onClick={handleOpenCreateModal}>Adicionar Responsável</Button></Box>
      </Box>
      <table className="table table-bordered">
        <thead><tr><th>Nome</th><th>Telefone</th><th>Email</th><th>CPF</th><th>Ações</th></tr></thead>
        <tbody>
          {loading ? (<tr><td colSpan="5">Carregando...</td></tr>) : filteredResponsaveis.map(resp => (
            <tr key={resp.id}>
              <td>{resp.name}</td><td>{resp.phone_number}</td><td>{resp.email}</td><td>{resp.cpf}</td>
              <td>
                <button className="btn btn-sm btn-warning mr-5" onClick={() => handleOpenEditModal(resp)}>Editar</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(resp.id)}>Remover</button>
              </td></tr>
          ))}
        </tbody>
      </table>
      <ResponsavelFormModal key={editingResponsavel ? `resp-edit-${editingResponsavel.id}` : 'resp-create'} open={modalOpen} onClose={handleCloseModal} onSubmit={handleFormSubmit} responsavel={editingResponsavel} />
    </div>
  );
}

// =================================================================
// MODAL DO FORMULÁRIO DE RESPONSÁVEL (Nomes de Campo corrigidos)
// =================================================================
function ResponsavelFormModal({ open, onClose, onSubmit, responsavel }) {
  const initialFormState = { name: "", phone_number: "", email: "", cpf: "", birthday: "", adress: "" };
  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    if (open) { // Só atualiza quando abre
        if (responsavel) {
          const formattedBirthday = responsavel.birthday ? responsavel.birthday.split('/').reverse().join('-') : "";
          setForm({ ...responsavel, birthday: formattedBirthday });
        } else {
          setForm(initialFormState);
        }
    }
  }, [responsavel, open]);

  const handleChange = (e) => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); };
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{responsavel ? "Editar Responsável" : "Adicionar Novo Responsável"}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12}><TextField name="name" label="Nome do Responsável" value={form.name} onChange={handleChange} fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><TextField name="phone_number" label="Telefone" value={form.phone_number} onChange={handleChange} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField name="email" label="Email" type="email" value={form.email} onChange={handleChange} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField name="cpf" label="CPF" value={form.cpf} onChange={handleChange} fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><TextField name="birthday" label="Data de Nascimento" value={form.birthday} onChange={handleChange} type="date" fullWidth InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><TextField name="adress" label="Endereço" value={form.adress} onChange={handleChange} fullWidth /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={onClose}>Cancelar</Button><Button type="submit" variant="contained">Salvar</Button></DialogActions>
      </form>
    </Dialog>
  );
}


// =================================================================
// PAINEL DE PROFESSORES (Refatorado)
// =================================================================
function ProfessorAdminPanel() {
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState(null);
  const [filters, setFilters] = useState({ nome: "", cpf: "", matricula: "" });

  const fetchData = async () => {
    setLoading(true);
    const headers = getAuthHeaders();
    if (!headers) { setLoading(false); return; }
    try {
      const res = await api.get("/professores/", { headers });
       // Garante que é um array
      setProfessores(Array.isArray(res.data) ? res.data : res.data.results || []);
    }
    catch (error) { console.error("Erro ao buscar professores:", error); if (error.response?.status === 403) alert("Você não tem permissão para carregar a lista de professores."); setProfessores([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  const handleFilterChange = (e) => { setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })); };
  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que quer remover este professor?")) return;
    const headers = getAuthHeaders(); if (!headers) return;
    try { await api.delete(`/professores/${id}/`, { headers }); alert("Professor removido com sucesso!"); fetchData(); }
    catch (error) { console.error("Erro ao remover o professor:", error.response?.data); alert("Erro ao remover o professor."); }
  };
  const handleOpenCreateModal = () => { setEditingProfessor(null); setModalOpen(true); };
  const handleOpenEditModal = (professor) => { setEditingProfessor(professor); setModalOpen(true); };
  const handleCloseModal = () => { setModalOpen(false); setEditingProfessor(null); };
  const handleFormSubmit = async (formData) => {
    const headers = getAuthHeaders(); if (!headers) return;
    try {
      if (editingProfessor) await api.put(`/professores/${editingProfessor.id}/`, formData, { headers });
      else await api.post("/professores/", formData, { headers });
      alert("Professor salvo com sucesso!"); handleCloseModal(); fetchData();
    } catch (error) { console.error("Erro ao salvar o professor:", error.response?.data); alert("Erro ao salvar o professor."); }
  };
  const filteredProfessores = professores.filter(prof => (
      (prof.name_professor?.toLowerCase().includes(filters.nome.toLowerCase())) && // Check null/undefined
      (prof.cpf_professor?.includes(filters.cpf)) && // Check null/undefined
      (prof.matricula_professor?.includes(filters.matricula)) // Check null/undefined
  ));

  return (
    <div>
      <h3 className="mb-20">Gerenciar Professores</h3>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Filtrar por Nome" name="nome" value={filters.nome} onChange={handleFilterChange} variant="outlined" size="small" /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Filtrar por CPF" name="cpf" value={filters.cpf} onChange={handleFilterChange} variant="outlined" size="small" /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Filtrar por Matrícula" name="matricula" value={filters.matricula} onChange={handleFilterChange} variant="outlined" size="small" /></Grid>
        </Grid>
        <Box ml={2} flexShrink={0}><Button variant="contained" color="primary" onClick={handleOpenCreateModal}>Adicionar Professor</Button></Box>
      </Box>
      <table className="table table-bordered">
        <thead><tr><th>Nome</th><th>Email</th><th>CPF</th><th>Matrícula</th><th>Disciplina</th><th>Ações</th></tr></thead>
        <tbody>
          {loading ? (<tr><td colSpan="5">Carregando...</td></tr>) : filteredProfessores.map(prof => (
            <tr key={prof.id}>
              <td>{prof.name_professor}</td><td>{prof.email_professor}</td><td>{prof.cpf_professor}</td><td>{prof.matricula_professor}</td><td>{prof.disciplina_label || prof.disciplina || 'N/D'}</td>
              <td>
                <button className="btn btn-sm btn-warning mr-5" onClick={() => handleOpenEditModal(prof)}>Editar</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(prof.id)}>Remover</button>
              </td></tr>
          ))}
        </tbody>
      </table>
      <ProfessorFormModal key={editingProfessor ? `prof-edit-${editingProfessor.id}`: 'prof-create'} open={modalOpen} onClose={handleCloseModal} onSubmit={handleFormSubmit} professor={editingProfessor} />
    </div>
  );
}

// =================================================================
// MODAL DO FORMULÁRIO DE PROFESSOR
// =================================================================
function ProfessorFormModal({ open, onClose, onSubmit, professor }) {
    // A DISCIPLINA_CHOICES é assumida como global/importada
    
    const initialFormState = { 
        name_professor: "", phone_number_professor: "", email_professor: "", 
        cpf_professor: "", birthday_professor: "", matricula_professor: "",
        // Disciplina inicializada
        disciplina: "" 
    };
    const [form, setForm] = useState(initialFormState);

    useEffect(() => {
        if (open) { 
            if (professor) {
                const formattedBirthday = professor.birthday_professor 
                    ? professor.birthday_professor.split('/').reverse().join('-') 
                    : "";
                
                //Ajuste: Carregar o campo 'disciplina' para edição
            
                setForm({ 
                    ...professor, 
                    birthday_professor: formattedBirthday,
                    disciplina: professor.disciplina || "", // Carrega a disciplina existente
                });
            } else {
                setForm(initialFormState); // Reset para criar novo
            }
        }
    }, [professor, open]);
    
    const handleChange = (e) => { 
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); 
    };
    
    const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };
    
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{professor ? "Editar Professor" : "Adicionar Novo Professor"}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2} mt={1}>
                        <Grid item xs={12} sm={6}><TextField name="name_professor" label="Nome do Professor" value={form.name_professor} onChange={handleChange} fullWidth required /></Grid>
                        <Grid item xs={12} sm={6}><TextField name="phone_number_professor" label="Telefone" value={form.phone_number_professor} onChange={handleChange} fullWidth /></Grid>
                        <Grid item xs={12} sm={6}><TextField name="email_professor" label="Email" type="email" value={form.email_professor} onChange={handleChange} fullWidth /></Grid>
                        <Grid item xs={12} sm={6}><TextField name="cpf_professor" label="CPF" value={form.cpf_professor} onChange={handleChange} fullWidth required /></Grid>
                        <Grid item xs={12} sm={6}><TextField name="birthday_professor" label="Data de Nascimento" value={form.birthday_professor} onChange={handleChange} type="date" fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                        <Grid item xs={12} sm={6}><TextField name="matricula_professor" label="Matrícula" value={form.matricula_professor} onChange={handleChange} fullWidth /></Grid>
                        
                        {/*  CAMPO DISCIPLINA */}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Disciplina</InputLabel>
                                <Select 
                                    name="disciplina" 
                                    label="Disciplina" 
                                    value={form.disciplina} 
                                    onChange={handleChange}
                                >
                                    <MenuItem value=""><em>Selecione a Matéria</em></MenuItem>
                                    {/* DiSCIPLINA_CHOICES deve estar definido no escopo do arquivo */}
                                    {DISCIPLINA_CHOICES.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions><Button onClick={onClose}>Cancelar</Button><Button type="submit" variant="contained">Salvar</Button></DialogActions>
            </form>
        </Dialog>
    );
}


// =================================================================
// MODAL DE FORMULÁRIO PARA ADICIONAR/EDITAR TAREFA
// =================================================================
function TaskFormModal({ open, onClose, alunoId, task = null, onSave }) {
    // Busca a cor do status para o form
    const STATUS_OPTIONS = STATUS_CHOICES.map(s => ({ value: s.value, label: s.label }));
    
    const initialFormState = { 
        aluno: alunoId, 
        titulo: '', 
        descricao: '', 
        data_limite: new Date().toISOString().split('T')[0], // Sugere data atual
        status: 'Pendente' // Padrão
    };

    const [form, setForm] = useState(initialFormState);
    const [loading, setLoading] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const isEdit = !!task;

    useEffect(() => {
        if (open) {
            if (isEdit) {
                const formattedDate = task.data_limite ? new Date(task.data_limite).toISOString().split('T')[0] : '';
                setForm({ 
                    aluno: alunoId,
                    titulo: task.titulo || '',
                    descricao: task.descricao || '',
                    data_limite: formattedDate,
                    status: task.status || 'Pendente'
                });
            } else {
                setForm(initialFormState);
            }
            setSaveError(null);
        }
    }, [open, task, alunoId]);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSaveError(null);
        const headers = getAuthHeaders();
        if (!headers) { 
            setLoading(false); 
            return; 
        }

      const taskPayload = {
            aluno: alunoId,
            titulo: form.titulo,
            descricao: form.descricao,
            data_limite: form.data_limite,
            status: form.status,
            // Não incluir campos como bimestre, disciplina etc.
        };

        try {
            if (isEdit) {
                await api.put(`/atividades-pendentes/${task.id}/`, form, { headers });
            } else {
                // Ao criar, forçamos o alunoId no payload, mesmo que já esteja no state.
                await api.post("/atividades-pendentes/", { ...form, aluno: alunoId }, { headers }); 
            }
            alert(`Tarefa ${isEdit ? 'atualizada' : 'criada'} com sucesso!`);
            onSave(); 
        } catch (error) {
            console.error("Erro ao salvar a tarefa:", error.response?.data || error);
            setSaveError(error.response?.data ? JSON.stringify(error.response.data) : "Erro de comunicação.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{isEdit ? "Editar Tarefa Pendente" : "Adicionar Nova Tarefa"}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2} mt={1}>
                        <Grid item xs={12}>
                            <TextField 
                                name="titulo" 
                                label="Título da Tarefa" 
                                value={form.titulo} 
                                onChange={handleChange} 
                                fullWidth 
                                required 
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField 
                                name="descricao" 
                                label="Descrição/Detalhes" 
                                value={form.descricao} 
                                onChange={handleChange} 
                                multiline 
                                rows={3} 
                                fullWidth 
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField 
                                name="data_limite" 
                                label="Prazo Final" 
                                value={form.data_limite} 
                                onChange={handleChange} 
                                type="date" 
                                fullWidth 
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select 
                                    name="status" 
                                    label="Status" 
                                    value={form.status} 
                                    onChange={handleChange} 
                                    required
                                >
                                    {STATUS_OPTIONS.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {saveError && (
                            <Grid item xs={12}>
                                <Typography color="error" variant="body2">
                                    Erro de Validação: {saveError}
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button type="submit" variant="contained" color="primary" disabled={loading}>
                        {loading ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Adicionar Tarefa')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}


// =================================================================
// MODAL PRINCIPAL: LISTAGEM DE TAREFAS PENDENTES DO ALUNO
// =================================================================
function AlunoTarefasModal({ open, onClose, aluno }) {
    const [tarefas, setTarefas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    const fetchData = async () => {
        if (!aluno?.id) return;
        setLoading(true);
        setError(null);
        const headers = getAuthHeaders();
        if (!headers) { setLoading(false); return; }

        try {
            // Busca as tarefas filtradas pelo aluno ID
            const res = await api.get(`/atividades-pendentes/?aluno=${aluno.id}`, { headers });
            const data = Array.isArray(res.data) ? res.data : res.data.results || [];
            
            // Ordena as tarefas: Pendentes/Em Andamento primeiro, por data limite crescente.
            data.sort((a, b) => {
                // Prioriza as não concluídas
                const aStatus = STATUS_CHOICES.find(s => s.value === a.status) || STATUS_CHOICES[0];
                const bStatus = STATUS_CHOICES.find(s => s.value === b.status) || STATUS_CHOICES[0];
                
                if (aStatus.value === 'Concluida' && bStatus.value !== 'Concluida') return 1;
                if (bStatus.value === 'Concluida' && aStatus.value !== 'Concluida') return -1;

                // Se o status for o mesmo, ordena pela data limite (os mais próximos primeiro)
                return new Date(a.data_limite) - new Date(b.data_limite);
            });
            
            setTarefas(data);
        } catch (err) {
            console.error("Erro ao buscar tarefas pendentes:", err.response?.data || err);
            setError("Erro ao carregar tarefas. Verifique se o endpoint '/atividades-pendentes/' está correto.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchData();
        }
    }, [open, aluno]);

    const handleOpenFormModal = (taskToEdit = null) => {
        setEditingTask(taskToEdit);
        setFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setFormModalOpen(false);
        setEditingTask(null);
    };

    const handleTaskSaved = () => {
        handleCloseFormModal();
        fetchData(); // Recarrega a lista
    };

    const handleTaskDelete = async (id) => {
        if (!window.confirm("Tem certeza que deseja remover esta tarefa?")) return;
        const headers = getAuthHeaders(); if (!headers) return;
        try {
            await api.delete(`/atividades-pendentes/${id}/`, { headers });
            alert("Tarefa removida com sucesso!");
            fetchData();
        } catch (error) {
            console.error("Erro ao remover a tarefa:", error.response?.data);
            alert("Erro ao remover a tarefa.");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/D';
        // Garante que é uma data válida antes de formatar
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (e) {
            return 'Data Inválida';
        }
    };
    
    // Helper para obter o rótulo e a cor do Status
    const getStatusInfo = (status) => {
        return STATUS_CHOICES.find(s => s.value === status) || { label: status, color: 'text.secondary' };
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                Tarefas Pendentes do Aluno: {aluno?.name_aluno || "..."}
            </DialogTitle>
            <DialogContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" gutterBottom>Lista de Tarefas</Typography>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        size="small" 
                        onClick={() => handleOpenFormModal(null)}
                    >
                        Adicionar Tarefa
                    </Button>
                </Box>

                {loading ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>Carregando tarefas...</Box>
                ) : error ? (
                    <Box sx={{ p: 3, color: 'error.main', textAlign: 'center' }}>{error}</Box>
                ) : tarefas.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center', border: '1px solid #eee' }}>Nenhuma tarefa pendente encontrada.</Box>
                ) : (
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                                    <TableCell>Título</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Prazo Final</TableCell>
                                    <TableCell>Data Criação</TableCell>
                                    <TableCell align="center">Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tarefas.map((task) => (
                                    <TableRow key={task.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell sx={{ maxWidth: 300 }}>
                                            <Typography variant="body1" fontWeight="bold">{task.titulo}</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ 
                                                whiteSpace: 'pre-wrap', 
                                                // Limita a exibição da descrição
                                                display: '-webkit-box',
                                                overflow: 'hidden',
                                                WebkitBoxOrient: 'vertical',
                                                WebkitLineClamp: 2, // Exibe no máximo 2 linhas
                                            }}>
                                                {task.descricao || 'Nenhuma descrição.'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color={getStatusInfo(task.status).color} fontWeight="bold">
                                                {getStatusInfo(task.status).label}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{formatDate(task.data_limite)}</TableCell>
                                        <TableCell>{formatDate(task.data_criacao)}</TableCell>
                                        <TableCell align="center" sx={{ minWidth: '100px' }}>
                                            <IconButton size="small" onClick={() => handleOpenFormModal(task)} color="primary">
                                                <EditIcon fontSize="small"/>
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleTaskDelete(task.id)} color="error">
                                                <DeleteIcon fontSize="small"/>
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Fechar</Button>
            </DialogActions>

            {/* Modal de Formulário de Edição/Criação */}
            <TaskFormModal
                open={formModalOpen}
                onClose={handleCloseFormModal}
                alunoId={aluno?.id}
                task={editingTask}
                onSave={handleTaskSaved}
            />
        </Dialog>
    );
}

// =================================================================
// COMPONENTES AUXILIARES (Para os formulários)
// =================================================================
const TurmaSelect = ({ value, onChange, name = "class_choice", label = "Turma", ...props }) => (<FormControl fullWidth {...props} size="small"><InputLabel>{label}</InputLabel><Select name={name} value={value} label={label} onChange={onChange}><MenuItem value=""><em>{label}</em></MenuItem><MenuItem value="1A">1 ANO A</MenuItem><MenuItem value="1B">1 ANO B</MenuItem><MenuItem value="1C">1 ANO C</MenuItem><MenuItem value="2A">2 ANO A</MenuItem><MenuItem value="2B">2 ANO B</MenuItem><MenuItem value="2C">2 ANO C</MenuItem><MenuItem value="3A">3 ANO A</MenuItem><MenuItem value="3B">3 ANO B</MenuItem><MenuItem value="3C">3 ANO C</MenuItem></Select></FormControl>);
const MesSelect = ({ value, onChange, name = "month_choice", label = "Mês da Matrícula", ...props }) => (<FormControl fullWidth {...props} size="small"><InputLabel>{label}</InputLabel><Select name={name} value={value} label={label} onChange={onChange}><MenuItem value=""><em>{label}</em></MenuItem><MenuItem value="01">Janeiro</MenuItem><MenuItem value="02">Fevereiro</MenuItem><MenuItem value="03">Março</MenuItem><MenuItem value="04">Abril</MenuItem><MenuItem value="05">Maio</MenuItem><MenuItem value="06">Junho</MenuItem><MenuItem value="07">Julho</MenuItem><MenuItem value="08">Agosto</MenuItem><MenuItem value="09">Setembro</MenuItem><MenuItem value="10">Outubro</MenuItem><MenuItem value="11">Novembro</MenuItem><MenuItem value="12">Dezembro</MenuItem></Select></FormControl>);

// =================================================================
// COMPONENTE PRINCIPAL (Administration)
// =================================================================
export default function Administration() {
  const [activeTab, setActiveTab] = useState(1);
  const renderTabContent = () => {
    switch (activeTab) {
      case 1: return <AlunoAdminPanel />;
      case 2: return <ResponsavelAdminPanel />;
      case 3: return <ProfessorAdminPanel />;
      case 4: return <SalaAdminPanel />;
      default: return null;
    }
  };
  return (
    <div className="dashboard__main">
      <div className="dashboard__content bg-light-4">
        <div className="row pb-50 mb-10"><div className="col-auto"><h1 className="text-30 lh-12 fw-700">Administração do Site</h1><PageLinksTwo /></div></div>
        <div className="row y-gap-30"><div className="col-12"><div className="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100"><div className="tabs -active-purple-2 js-tabs pt-0"><div className="tabs__controls d-flex x-gap-30 flex-wrap items-center pt-20 px-20 border-bottom-light js-tabs-controls">{tabs.map((elm) => (<div onClick={() => setActiveTab(elm.id)} key={elm.id} className=""><button className={`tabs__button text-light-1 js-tabs-button ${activeTab == elm.id ? "is-active" : ""} `} type="button">{elm.title}</button></div>))}</div><div className="tabs__content py-40 px-30 js-tabs-content">{renderTabContent()}</div></div></div></div></div>
      </div>
      <FooterNine />
    </div>
  );
}

//BAKAYARO

