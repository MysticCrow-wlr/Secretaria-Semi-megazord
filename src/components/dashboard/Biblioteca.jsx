import React, { useState, useEffect } from "react";

import {
    Button, Dialog, DialogTitle, DialogContent, DialogActions, 
    TextField, Select, MenuItem, InputLabel, FormControl, Box, Grid, 
    Typography, Table, TableBody, TableCell, TableContainer, TableHead, 
    TableRow, Paper, IconButton, FormControlLabel, Tab, 
} from "@mui/material";
import TabContext from '@mui/lab/TabContext'; 
import TabList from '@mui/lab/TabList'; 
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete'; 

import PageLinksTwo from "../common/PageLinksTwo";
import FooterNine from "../layout/footers/FooterNine";
import api from "@/api/axios"; // Ajuste se o caminho for diferente

// CONSTANTES (Copie do Administration.jsx)
const DEVOLVIDO_CHOICES = [ 
    { value: 'true', label: 'Devolvidos' }, {
     value: 'false', label: 'Pendentes' }];

const EMPRESTIMO_TIPO_CHOICES = [
    { value: 'livro', label: 'Livro' },
    { value: 'computador', label: 'Computador' },];

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.error("Token de autenticação não encontrado.");
    return null;
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// =================================================================
// FUNÇÕES AUXILIARES DE MODAL (COLE AQUI: LivroFormModal e EmprestimoFormModal)
// =================================================================

// MODAL DO FORMULÁRIO DE LIVRO (Adicionar/Editar)
function LivroFormModal({ open, onClose, onSubmit, livro = null }) {
    const initialFormState = { titulo: "", autor: "", isbn: "", exemplares_disponiveis: 1 ,data_publicacao: ""};
    const [form, setForm] = useState(initialFormState);
    const isEdit = !!livro;

    useEffect(() => {
        if (open) { 
            setForm(isEdit ? { ...livro } : initialFormState);
        }
    }, [livro, open, isEdit]);

    const handleChange = (e) => { 
        const { name, value } = e.target;
        const finalValue = name === "exemplares_disponiveis" ? Number(value) : value;
        setForm(prev => ({ ...prev, [name]: finalValue })); 
    };
    
    const handleSubmit = async (e) => { 
    e.preventDefault(); 
    
    // Capturar o elemento ativo (o botão 'Salvar')
    const activeElement = document.activeElement; 

    onSubmit(form); 

    // Remove o foco do botão. 
    if (activeElement && typeof activeElement.blur === 'function') {
        activeElement.blur();
    }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{isEdit ? "Editar Livro" : "Adicionar Novo Livro ao Estoque"}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2} mt={1}>
                        <Grid item xs={12}><TextField name="titulo" label="Título" value={form.titulo} onChange={handleChange} fullWidth required size="small" /></Grid>
                        <Grid item xs={12} sm={6}><TextField name="autor" label="Autor" value={form.autor} onChange={handleChange} fullWidth required size="small" /></Grid>
                        <Grid item xs={12} sm={6}><TextField name="isbn" label="ISBN" value={form.isbn} onChange={handleChange} fullWidth required size="small" /></Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField 
                                name="data_publicacao" 
                                label="Data de Publicação" 
                                type="date" 
                                value={form.data_publicacao} 
                                onChange={handleChange} 
                                fullWidth 
                                size="small" 
                                InputLabelProps={{ shrink: true }}
                                
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField 
                                name="exemplares_disponiveis" 
                                label="Exemplares em Estoque" 
                                type="number" 
                                value={form.exemplares_disponiveis} 
                                onChange={handleChange} 
                                fullWidth 
                                required 
                                size="small" 
                                inputProps={{ min: 0 }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions><Button onClick={onClose}>Cancelar</Button><Button type="submit" variant="contained">Salvar</Button></DialogActions>
            </form>
        </Dialog>
    );
}

// MODAL DO FORMULÁRIO DE EMPRÉSTIMO (Adicionar/Devolução)
function EmprestimoFormModal({ open, onClose, onSubmit, emprestimo = null, alunos = [], livros = [] }) {
    const EMPRESTIMO_TIPO_CHOICES = [
        { value: 'livro', label: 'Livro' },
        { value: 'computador', label: 'Computador' },
    ];
    
    const initialFormState = { 
        aluno: null, 
        tipo: 'livro', // Adicionamos tipo no estado
        livro: null, 
        computador: '', //Adicionamos computador no estado
        data_emprestimo: new Date().toISOString().split('T')[0], 
        data_devolucao: '', 
        devolvido: false 
    };
    const [form, setForm] = useState(initialFormState);
    const isEdit = !!emprestimo;

    useEffect(() => {
        if (open) { 
            if (isEdit) {
                const alunoData = emprestimo.aluno;
                const livroData = emprestimo.livro;
                
                //CORREÇÃO: Força o ID, assumindo que ele deve existir na edição.
                const alunoId = typeof alunoData === 'object' ? alunoData.id : alunoData;
                const livroId = typeof livroData === 'object' ? livroData.id : livroData;
                
                setForm({
                    //Utilizando ID direto agora
                    aluno: alunoId, 
                    tipo: emprestimo.tipo || 'livro',
                    livro: livroId, // ID aqui
                    computador: emprestimo.computador || '',
                    data_emprestimo: emprestimo.data_emprestimo, // Tem ser a data original
                    data_devolucao: emprestimo.data_devolucao || '',
                    devolvido: emprestimo.devolvido || false,
                });
            } else {
                setForm(initialFormState);
            }
        }
    }, [emprestimo, open, isEdit]);

    const handleChange = (e) => { 
        const { name, value, type, checked } = e.target;
        
        let finalValue;
        if (type === 'checkbox') {
            finalValue = checked;
        } else if (name === 'aluno' || name === 'livro') {
            finalValue = value === '' ? null : Number(value);
        } else {
            finalValue = value;
        }
        
        //  Se o TIPO mudar, resetar o campo alternativo
        if (name === 'tipo') {
            if (value === 'livro') {
                 setForm(prev => ({ ...prev, tipo: value, computador: '' }));
                 return;
            } else if (value === 'computador') {
                 setForm(prev => ({ ...prev, tipo: value, livro: null }));
                 return;
            }
        }
        
        setForm(prev => ({ ...prev, [name]: finalValue })); 
    };
    
    const handleSubmit = (e) => { 
    e.preventDefault(); 
    
    // Criar um payload EXPLICITO.
    // Garante que o Aluno e o Livro (que são IDs obrigatórios no PUT) 
    // sejam enviados, mesmo que o campo de formulário no JSX esteja "disabled".
    let payload = {
        aluno: form.aluno, // Envia o ID que foi preenchido no useEffect
        tipo: form.tipo,
        livro: form.livro, // Envia o ID do Livro (ou null)
        computador: form.computador,
        data_emprestimo: form.data_emprestimo,
        devolvido: form.devolvido,
        
        // Dados que o DRF precisa para PUT
        data_devolucao: form.data_devolucao || null,
    };

    // Lógica para garantir que data_devolucao seja NULL se não devolvido 
    if (!form.devolvido) {
        payload.data_devolucao = null;
    }

    // O payload ajustado é enviado para a função onSubmit 
    onSubmit(payload);
};

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{isEdit ? "Registrar Devolução" : "Registrar Novo Empréstimo"}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2} mt={1}>
                        <Grid item xs={12} sm={6}>
                            {/* CAMPO ALUNO */}
                            <FormControl fullWidth required size="small" disabled={isEdit && !emprestimo?.devolvido}>
                                <InputLabel>Aluno</InputLabel>
                                <Select name="aluno" label="Aluno" value={form.aluno === null ? "" : form.aluno} onChange={handleChange}>
                                    <MenuItem value=""><em>Selecione o Aluno</em></MenuItem>
                                    {alunos.map(a => (<MenuItem key={a.id} value={a.id}>{a.name_aluno}</MenuItem>))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            {/* CAMPO TIPO */}
                            <FormControl fullWidth required size="small" disabled={isEdit && !emprestimo?.devolvido}>
                                <InputLabel>Tipo de Recurso</InputLabel>
                                <Select name="tipo" label="Tipo de Recurso" value={form.tipo} onChange={handleChange}>
                                    {EMPRESTIMO_TIPO_CHOICES.map(c => (<MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            {/*Campo condicional para o livro e computador*/}
                            {form.tipo === 'livro' ? (
                                <FormControl fullWidth required size="small" disabled={isEdit && !emprestimo?.devolvido}>
                                    <InputLabel>Livro</InputLabel>
                                    <Select name="livro" label="Livro" value={form.livro === null ? "" : form.livro} onChange={handleChange}>
                                        <MenuItem value=""><em>Selecione o Livro</em></MenuItem>
                                        {livros
                                            .filter(l => l.exemplares_disponiveis > 0 || l.id === form.livro) 
                                            .map(l => (<MenuItem key={l.id} value={l.id}>{l.titulo} ({l.exemplares_disponiveis} em estoque)</MenuItem>))}
                                    </Select>
                                </FormControl>
                            ) : (
                                <TextField 
                                    name="computador" 
                                    label="Identificação do Computador" 
                                    value={form.computador} 
                                    onChange={handleChange} 
                                    fullWidth 
                                    required 
                                    size="small" 
                                    disabled={isEdit && !emprestimo?.devolvido}
                                />
                            )}
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            {/* DATA DE EMPRÉSTIMO */}
                            <TextField name="data_emprestimo" label="Data do Empréstimo" type="date" value={form.data_emprestimo} onChange={handleChange} fullWidth required size="small" InputLabelProps={{ shrink: true }} disabled={isEdit} />
                        </Grid>
                        
                        {/* Campo de Devolução  */}
                        <Grid item xs={12}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    {/* Checkbox Devolvido */}
                                    <FormControlLabel
                                        control={
                                            <input type="checkbox" name="devolvido" checked={form.devolvido} onChange={handleChange} style={{ marginRight: 8 }}/>
                                        }
                                        label="Devolvido?"
                                    />
                                </Grid>
                                
                                {form.devolvido && (
                                    <Grid item xs={12} sm={6}>
                                        {/*Data da devolução. é obrigatorio para a devolução */}
                                        <TextField 
                                            name="data_devolucao" 
                                            label="Data da Devolução" 
                                            type="date" 
                                            value={form.data_devolucao || new Date().toISOString().split('T')[0]} 
                                            onChange={handleChange} 
                                            fullWidth required size="small" InputLabelProps={{ shrink: true }} 
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </Grid>

                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="contained" color="primary">{isEdit ? "Registrar Devolução" : "Registrar Empréstimo"}</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

// =================================================================
// PAINÉIS DE LISTAGEM (Tem o: LivroAdminPanel e EmprestimoAdminPanel)
// =================================================================

// PAINEL DE GERENCIAMENTO DE LIVROS 
function LivroAdminPanel() {
    // [ Código da LivroAdminPanel com sua lógica de CRUD ]
    const [livros, setLivros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingLivro, setEditingLivro] = useState(null);
    const [filters, setFilters] = useState({ titulo: "", autor: "" });

    const fetchData = async () => {
        setLoading(true);
        const headers = getAuthHeaders(); if (!headers) { setLoading(false); return; }
        try {
            const res = await api.get("/livros/", { headers });
            setLivros(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (error) {
            console.error("Erro ao buscar livros:", error);
            if (error.response?.status === 403) alert("Sem permissão para ver Livros.");
            setLivros([]);
        } finally { setLoading(false); }
    };
    useEffect(() => { fetchData(); }, []);
    const handleFilterChange = (e) => { setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })); };
    
    const handleOpenCreateModal = () => { setEditingLivro(null); setModalOpen(true); };
    const handleOpenEditModal = (livro) => { setEditingLivro(livro); setModalOpen(true); };
    const handleCloseModal = () => { setModalOpen(false); setEditingLivro(null); fetchData(); };
    
    const handleFormSubmit = async (formData) => {
        const headers = getAuthHeaders(); if (!headers) return;
        try {
            if (editingLivro) await api.put(`/livros/${editingLivro.id}/`, formData, { headers });
            else await api.post("/livros/", formData, { headers });
            alert("Livro salvo com sucesso!"); handleCloseModal();
        } catch (error) { console.error("Erro ao salvar livro:", error.response?.data); alert("Erro ao salvar livro."); }
    };
    
    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que quer remover este livro?")) return;
        const headers = getAuthHeaders(); if (!headers) return;
        try { await api.delete(`/livros/${id}/`, { headers }); alert("Livro removido com sucesso!"); fetchData(); }
        catch (error) { console.error("Erro ao remover livro:", error.response?.data); alert("Erro ao remover livro."); }
    };

    const filteredLivros = livros.filter(livro =>
        (livro.titulo?.toLowerCase().includes(filters.titulo.toLowerCase())) &&
        (livro.autor?.toLowerCase().includes(filters.autor.toLowerCase()))
    );

    return (
        <div>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}><TextField fullWidth label="Filtrar por Título" name="titulo" value={filters.titulo} onChange={handleFilterChange} variant="outlined" size="small" /></Grid>
                    <Grid item xs={12} sm={6}><TextField fullWidth label="Filtrar por Autor" name="autor" value={filters.autor} onChange={handleFilterChange} variant="outlined" size="small" /></Grid>
                </Grid>
                <Box ml={2} flexShrink={0}><Button variant="contained" color="primary" onClick={handleOpenCreateModal}>Adicionar Livro</Button></Box>
            </Box>
            <table className="table table-bordered">
                <thead><tr><th>Título</th><th>Autor</th><th>ISBN</th><th>Em Estoque</th><th>Ações</th></tr></thead>
                <tbody>
                    {loading ? (<tr><td colSpan="5">Carregando livros...</td></tr>) : filteredLivros.map(livro => (
                        <tr key={livro.id}>
                            <td>{livro.titulo}</td><td>{livro.autor}</td><td>{livro.isbn || ''}</td><td>{livro.exemplares_disponiveis || 0}</td>
                            <td>
                                <button className="btn btn-sm btn-warning mr-5" onClick={() => handleOpenEditModal(livro)}>Editar</button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(livro.id)}>Remover</button>
                            </td></tr>
                    ))}
                </tbody>
            </table>
            <LivroFormModal key={editingLivro ? `livro-edit-${editingLivro.id}` : 'livro-create'} open={modalOpen} onClose={handleCloseModal} onSubmit={handleFormSubmit} livro={editingLivro} />
        </div>
    );
}

// PAINEL DE GERENCIAMENTO DE EMPRÉSTIMOS 
function EmprestimoAdminPanel() {
    // [ Código da EmprestimoAdminPanel com sua lógica de CRUD ]
    const [emprestimos, setEmprestimos] = useState([]);
    const [alunos, setAlunos] = useState([]); 
    const [livros, setLivros] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingEmprestimo, setEditingEmprestimo] = useState(null);
    const [filters, setFilters] = useState({ aluno: "", devolvido: "" });

    const fetchData = async () => {
        setLoading(true);
        const headers = getAuthHeaders(); if (!headers) { setLoading(false); return; }
        try {
            const [empRes, alunosRes, livrosRes] = await Promise.allSettled([
                api.get("/emprestimos/", { headers }),
                api.get("/alunos/", { headers }),
                api.get("/livros/", { headers }),
            ]);
            
            if (empRes.status === 'fulfilled') setEmprestimos(Array.isArray(empRes.value.data) ? empRes.value.data : empRes.value.data.results || []);
            if (alunosRes.status === 'fulfilled') setAlunos(Array.isArray(alunosRes.value.data) ? alunosRes.value.data : alunosRes.value.data.results || []);
            if (livrosRes.status === 'fulfilled') setLivros(Array.isArray(livrosRes.value.data) ? livrosRes.value.data : livrosRes.value.data.results || []);

        } catch (error) {
            console.error("Erro ao buscar dados de empréstimo:", error);
            if (error.response?.status === 403) alert("Sem permissão para gerenciar Empréstimos.");
        } finally { setLoading(false); }
    };
    
    useEffect(() => { fetchData(); }, []);
    
    const handleFilterChange = (e) => { setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })); };
    
    const handleOpenCreateModal = () => { setEditingEmprestimo(null); setModalOpen(true); };
    const handleOpenEditModal = (emprestimo) => { setEditingEmprestimo(emprestimo); setModalOpen(true); };
    const handleCloseModal = () => { setModalOpen(false); setEditingEmprestimo(null); fetchData(); };
    
    const handleFormSubmit = async (formData) => {
    const headers = getAuthHeaders(); if (!headers) return;
    
    //  Payload
    const finalPayload = {
        ...(editingEmprestimo || {}), 
        ...formData,
        // Garante que a chave 'aluno' seja o ID que veio do formulário (que foi carregado via useEffect)
        aluno: formData.aluno, 
        livro: formData.livro,
    };
    
    try {
        if (editingEmprestimo) {
            // Usa patch com payload
            await api.patch(`/emprestimos/${editingEmprestimo.id}/`, finalPayload, { headers }); 
        } else {
            await api.post("/emprestimos/", finalPayload, { headers });
        }
        alert("Empréstimo/Devolução registrado com sucesso!"); 
        handleCloseModal();
    } catch (error) { 
        console.error("Erro ao salvar empréstimo:", error.response?.data); 
        const validationError = error.response?.data ? JSON.stringify(error.response.data) : "Erro de comunicação.";
        alert(`Erro ao salvar empréstimo: ${validationError}`);
    }
   };
    
    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que quer remover este registro de empréstimo?")) return;
        const headers = getAuthHeaders(); if (!headers) return;
        try { await api.delete(`/emprestimos/${id}/`, { headers }); alert("Registro removido!"); fetchData(); }
        catch (error) { console.error("Erro ao remover registro:", error.response?.data); alert("Erro ao remover registro."); }
    };

    const filteredEmprestimos = emprestimos.filter(emp =>
        (filters.aluno === "" || emp.aluno == filters.aluno) &&
        (filters.devolvido === "" || emp.devolvido == (filters.devolvido === 'true'))
    );
    
    return (
        <div>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Filtrar por Aluno</InputLabel>
                            <Select name="aluno" label="Filtrar por Aluno" value={filters.aluno} onChange={handleFilterChange}>
                                <MenuItem value=""><em>Todos os Alunos</em></MenuItem>
                                {alunos.map(a => (<MenuItem key={a.id} value={a.id}>{a.name_aluno}</MenuItem>))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Filtrar por Status</InputLabel>
                            <Select name="devolvido" label="Filtrar por Status" value={filters.devolvido} onChange={handleFilterChange}>
                                <MenuItem value=""><em>Todos os Status</em></MenuItem>
                                {DEVOLVIDO_CHOICES.map(opt => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                <Box ml={2} flexShrink={0}><Button variant="contained" color="primary" onClick={handleOpenCreateModal}>Novo Empréstimo</Button></Box>
            </Box>
            <table className="table table-bordered">
                <thead><tr><th>Aluno</th><th>Livro/Recurso</th><th>Empréstimo</th><th>Devolução Estimada</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                    {loading ? (<tr><td colSpan="6">Carregando empréstimos...</td></tr>) : filteredEmprestimos.map(emp => (
                        <tr key={emp.id}>

                            <td>{emp.aluno_nome || 'N/D'}</td> 
                            
                            <td>
                                {emp.tipo === 'livro' 
                                    ? (emp.livro_titulo || 'Livro Removido') 
                                    : (emp.computador || 'Computador N/D')}
                            </td>
                            
                            <td>{emp.data_emprestimo}</td>
                            <td>{emp.data_devolucao || '---'}</td>
                            <td>
                                <Typography color={emp.devolvido ? 'success.main' : 'error.main'} fontWeight="bold">
                                    {emp.devolvido ? 'Devolvido' : 'Pendente'}
                                </Typography>
                            </td>
                            <td>
                                {!emp.devolvido ? (
                                    <button className="btn btn-sm btn-success mr-5" onClick={() => handleOpenEditModal(emp)}>Registrar Devolução</button>
                                ) : (
                                    <button className="btn btn-sm btn-warning mr-5" onClick={() => handleOpenEditModal(emp)}>Editar</button>
                                )}
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(emp.id)}>Remover</button>
                            </td></tr>
                    ))}
                </tbody>
            </table>
            <EmprestimoFormModal 
                key={editingEmprestimo ? `emp-edit-${editingEmprestimo.id}` : 'emp-create'} 
                open={modalOpen} 
                onClose={handleCloseModal} 
                onSubmit={handleFormSubmit} 
                emprestimo={editingEmprestimo} 
                alunos={alunos}
                livros={livros}
            />
        </div>
    );
}


// =================================================================
// 3CONTAINER PRINCIPAL DA BIBLIOTECA 
// =================================================================

export default function BibliotecaEmprestimos() {
    // 1: Empréstimos | 2: Livros
    const [innerTab, setInnerTab] = useState('1'); 
    
    const handleChange = (event, newValue) => {
        setInnerTab(newValue);
    };

    return (
        <div className="dashboard__main">
            <div className="dashboard__content bg-light-4">
                <div className="row pb-50 mb-10">
                    <div className="col-auto">
                        <h1 className="text-30 lh-12 fw-700">Gestão de Empréstimos e Recursos</h1>
                        <PageLinksTwo />
                    </div>
                </div>

                <div className="row y-gap-30">
                    <div className="col-12">
                        <div className="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                            <Box sx={{ width: '100%', typography: 'body1', p: 3 }}>
                                <TabContext value={innerTab}>
                                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                        <TabList onChange={handleChange} aria-label="Navegação da Biblioteca">
                                            <Tab label="Gerenciar Empréstimos" value="1" />
                                            <Tab label="Gerenciar Estoque de Recursos" value="2" />
                                        </TabList>
                                    </Box>
                                    
                                    {/* Tab 1: Empréstimos (Lista de Empréstimos e Devoluções) */}
                                    {innerTab === '1' && (
                                        <Box sx={{ pt: 3 }}><EmprestimoAdminPanel /></Box>
                                    )}
                                    
                                    {/* Tab 2: Estoque (CRUD de Livros/Recursos) */}
                                    {innerTab === '2' && (
                                        <Box sx={{ pt: 3 }}><LivroAdminPanel /></Box>
                                    )}
                                </TabContext>
                            </Box>
                        </div>
                    </div>
                </div>
            </div>
            <FooterNine />
        </div>
    );
}