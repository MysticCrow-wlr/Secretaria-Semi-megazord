import React, { useState, useEffect } from "react";
import FooterNine from "../layout/footers/FooterNine";
import PageLinksTwo from "../common/PageLinksTwo";
import api from "@/api/axios";

// Importa vários componentes da biblioteca de UI Material-UI (MUI)
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
  Typography,     
  Table,          
  TableBody,      
  TableCell,      
  TableContainer, 
  TableHead,      
  TableRow,       
  Paper,          
  IconButton,     
  Card,           
  CardContent,    
  Chip,           
  Tabs,          
  Tab             
} from "@mui/material";

// Importa ícones do Material-UI
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon, // Ícone de agenda
  Group as GroupIcon,       // Ícone de grupo (turma)
  Person as PersonIcon      // Ícone de pessoa
} from "@mui/icons-material";

// Função helper (auxiliar) para pegar o token de autenticação do localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.error("Token de autenticação não encontrado.");
    return null;
  }
  // Retorna o cabeçalho de autorização para a API
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Componente auxiliar do Material-UI para exibir o conteúdo da aba selecionada
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index} // Esconde o conteúdo se não for a aba ativa
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Define e exporta o componente principal da página de Planejamento Semanal
export default function PlanejamentoSemanal() {
  // --- Estados do Componente ---
  const [planejamentos, setPlanejamentos] = useState([]); // Armazena a lista de planejamentos vinda da API
  const [professores, setProfessores] = useState([]); // Armazena a lista de professores (para o dropdown)
  const [opcoes, setOpcoes] = useState({}); // Armazena as opções dos dropdowns (turmas, turnos, dias)
  const [loading, setLoading] = useState(false); // Indica se os dados estão sendo carregados
  const [activeTab, setActiveTab] = useState(0); // Controla qual aba (Lista ou Visão por Turma) está ativa
  const [openDialog, setOpenDialog] = useState(false); // Controla se o modal (dialog) de Adicionar/Editar está aberto
  const [editId, setEditId] = useState(null); // Armazena o ID do planejamento que está sendo editado (null se for novo)

  // Estado que armazena os dados do formulário do modal
  const [form, setForm] = useState({
    professor: "",
    turma: "",
    disciplina: "",
    dia_semana: "",
    data_aula: "",
    turno: "",
    horario_inicio: "",
    horario_fim: "",
    conteudo: "",
    atividades: "",
    recursos: "",
    observacoes: ""
  });

  // Hook que é executado uma vez quando o componente é montado para buscar os dados
  useEffect(() => {
    fetchData();
  }, []);

  // Função assíncrona para buscar todos os dados necessários da API
  const fetchData = async () => {
    setLoading(true); // Ativa o "Carregando..."
    try {
      const headers = getAuthHeaders();
      if (!headers) return; // Para se não tiver token

      // Busca planejamentos, professores e opções de dropdown em paralelo (ao mesmo tempo)
      const [planejamentosRes, professoresRes, opcoesRes] = await Promise.all([
        api.get("/planejamentos-semanais/", { headers }),
        api.get("/professores/", { headers }),
        api.get("/planejamento-opcoes/", { headers }),
      ]);
      
      // Atualiza os estados com os dados recebidos da API
      setPlanejamentos(planejamentosRes.data);
      setProfessores(professoresRes.data);
      setOpcoes(opcoesRes.data);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false); // Desativa o "Carregando..."
    }
  };

  // Atualiza o estado 'form' sempre que o usuário digita em um campo do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função chamada ao enviar o formulário (salvar)
  const handleSubmit = async (e) => {
    e.preventDefault(); // Impede o recarregamento da página
    
    // Validações básicas
    if (!form.professor || !form.turma || !form.disciplina || !form.data_aula) {
      alert("Preencha os campos obrigatórios: Professor, Turma, Disciplina e Data da Aula");
      return;
    }

    if (form.horario_inicio >= form.horario_fim) {
      alert("O horário de início deve ser anterior ao horário de término");
      return;
    }

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      // Decide se deve ATUALIZAR (PUT) ou CRIAR (POST) um planejamento
      if (editId) {
        // Se 'editId' existe, é uma atualização
        await api.put(`/planejamentos-semanais/${editId}/`, form, { headers });
      } else {
        // Se 'editId' é nulo, é uma criação
        await api.post("/planejamentos-semanais/", form, { headers });
      }
      
      // Após salvar, recarrega os dados, limpa o formulário e fecha o modal
      await fetchData(); // Atualiza a lista na tabela
      resetForm();
      setOpenDialog(false);
      alert(`Planejamento ${editId ? "atualizado" : "criado"} com sucesso!`);
    } catch (error) {
      console.error("Erro ao salvar:", error.response?.data);
      alert("Erro ao salvar planejamento. Verifique os dados.");
    }
  };

  // Limpa o formulário, voltando ao estado inicial e removendo o ID de edição
  const resetForm = () => {
    setForm({
      // ... (zera todos os campos)
      professor: "", turma: "", disciplina: "", dia_semana: "", data_aula: "",
      turno: "", horario_inicio: "", horario_fim: "", conteudo: "",
      atividades: "", recursos: "", observacoes: ""
    });
    setEditId(null); // Garante que o próximo 'submit' seja de criação
  };

  // Função chamada ao clicar no botão 'Editar' de um item da tabela
  const handleEdit = (planejamento) => {
    // Preenche o formulário com os dados do planejamento selecionado
    setForm({
      professor: planejamento.professor?.id || planejamento.professor, // Garante que está pegando o ID
      turma: planejamento.turma,
      disciplina: planejamento.disciplina,
      dia_semana: planejamento.dia_semana,
      data_aula: planejamento.data_aula,
      turno: planejamento.turno,
      horario_inicio: planejamento.horario_inicio,
      horario_fim: planejamento.horario_fim,
      conteudo: planejamento.conteudo,
      atividades: planejamento.atividades,
      recursos: planejamento.recursos,
      observacoes: planejamento.observacoes
    });
    setEditId(planejamento.id); // Define o ID de edição
    setOpenDialog(true); // Abre o modal
  };

  // Função chamada ao clicar no botão 'Excluir'
  const handleDelete = async (id) => {
    // Pede confirmação
    if (!confirm("Tem certeza que deseja excluir este planejamento?")) return;
    
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      // Envia a requisição DELETE para a API
      await api.delete(`/planejamentos-semanais/${id}/`, { headers });
      await fetchData(); // Recarrega a lista
      alert("Planejamento excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir planejamento.");
    }
  };

  // Abre o modal para CRIAR um novo planejamento (limpando o formulário)
  const handleOpenDialog = () => {
    resetForm();
    setOpenDialog(true);
  };

  // Fecha o modal e limpa o formulário
  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  // --- Funções Auxiliares (Helpers) para a renderização ---

  // Função auxiliar para encontrar o nome do professor (seja objeto ou só ID)
  const getNomeProfessor = (professor) => {
    if (!professor) return "N/A";
    if (typeof professor === 'object') return professor.name_professor; // Se já for um objeto
    const prof = professores.find(p => p.id === professor); // Se for só o ID
    return prof ? prof.name_professor : `Professor ${professor}`;
  };

  // Função auxiliar para encontrar o 'label' (texto) de um 'value' (valor) nos dropdowns
  const getLabel = (valor, array) => {
    const item = array?.find(item => item.value === valor);
    return item ? item.label : valor; // Retorna o texto bonito (label) ou o valor bruto
  };

  // Função auxiliar para definir a cor do 'Chip' do dia da semana
  const getDiaSemanaColor = (dia) => {
    const colors = {
      'SEG': 'primary', 'TER': 'secondary', 'QUA': 'info',
      'QUI': 'warning', 'SEX': 'success', 'SAB': 'error', 'DOM': 'default'
    };
    return colors[dia] || 'default';
  };

  // --- Renderização do Componente (JSX) ---
  return (
    <div className="dashboard__main">
      <div className="dashboard__content bg-light-4">
        {/* Título da Página e Navegação */}
        <div className="row pb-50 mb-10">
          <div className="col-auto">
            <h1 className="text-30 lh-12 fw-700">Planejamento Semanal de Aulas</h1>
            <PageLinksTwo />
          </div>
        </div>

        {/* Cards de Estatísticas (Total, Professores, Turmas) */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3}>
            {/* Card 1: Total */}
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {planejamentos.length}
                  </Typography>
                  <Typography variant="body2">Total de Planejamentos</Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Card 2: Professores */}
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {new Set(planejamentos.map(p => p.professor)).size}
                  </Typography>
                  <Typography variant="body2">Professores com Planejamento</Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Card 3: Turmas */}
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {new Set(planejamentos.map(p => p.turma)).size}
                  </Typography>
                  <Typography variant="body2">Turmas com Planejamento</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Container principal com Abas (Tabs) */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            {/* Botões das Abas */}
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab icon={<ScheduleIcon />} label="Lista de Planejamentos" iconPosition="start" />
              <Tab icon={<GroupIcon />} label="Visão por Turma" iconPosition="start" />
            </Tabs>
          </Box>

          {/* Aba 1: Lista de Planejamentos */}
          <TabPanel value={activeTab} index={0}>
            {/* Cabeçalho da Aba (Título e Botão Novo) */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                Planejamentos Cadastrados
              </Typography>
              {/* Botão para abrir o modal de criação */}
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                sx={{ borderRadius: 2 }}
              >
                Novo Planejamento
              </Button>
            </Box>

            {/* Feedback de Carregamento */}
            {loading && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography>Carregando...</Typography>
              </Box>
            )}

            {/* Tabela para listar os planejamentos */}
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                {/* Cabeçalho da Tabela */}
                <TableHead sx={{ bgcolor: 'primary.main' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Turma</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Disciplina</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Professor</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Data</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Dia</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Horário</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Turno</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} width="120">Ações</TableCell>
                  </TableRow>
                </TableHead>
                {/* Corpo da Tabela */}
                <TableBody>
                  {/* Mostra uma mensagem se a tabela estiver vazia */}
                  {planejamentos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="textSecondary">
                          Nenhum planejamento cadastrado
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Mapeia a lista de planejamentos e cria uma linha (TableRow) para cada um
                    planejamentos.map(planejamento => (
                      <TableRow key={planejamento.id} hover>
                        {/* Células da tabela, usando as funções auxiliares para formatar os dados */}
                        <TableCell>
                          <Chip 
                            label={getLabel(planejamento.turma, opcoes.turmas)} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {planejamento.disciplina}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {getNomeProfessor(planejamento.professor)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {new Date(planejamento.data_aula).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getLabel(planejamento.dia_semana, opcoes.dias_semana)} 
                            size="small" 
                            color={getDiaSemanaColor(planejamento.dia_semana)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {planejamento.horario_inicio} - {planejamento.horario_fim}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getLabel(planejamento.turno, opcoes.turnos)}
                        </TableCell>
                        {/* Botões de Ação (Editar e Excluir) para cada linha */}
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              color="warning"
                              onClick={() => handleEdit(planejamento)} // Chama a função de editar
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDelete(planejamento.id)} // Chama a função de excluir
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Aba 2: Visão por Turma */}
          <TabPanel value={activeTab} index={1}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>
              Visão por Turma
            </Typography>
            <Typography color="textSecondary">
              Em desenvolvimento - Esta aba mostrará os planejamentos agrupados por turma.
            </Typography>
          </TabPanel>
        </Card>

        {/* Modal (Dialog) para Adicionar ou Editar Planejamento */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          {/* Título dinâmico (Novo ou Editar) */}
          <DialogTitle>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
              {editId ? "Editar Planejamento" : "Novo Planejamento Semanal"}
            </Typography>
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              {/* Grid com os campos do formulário */}
              <Grid container spacing={2} sx={{ mt: 1 }}>
                
                {/* Campo Professor (Dropdown) */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Professor Responsável</InputLabel>
                    <Select
                      name="professor"
                      value={form.professor}
                      onChange={handleChange}
                      label="Professor Responsável"
                    >
                      {professores.map(prof => (
                        <MenuItem key={prof.id} value={prof.id}>
                          {prof.name_professor}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Campo Turma (Dropdown) */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Turma</InputLabel>
                    <Select
                      name="turma"
                      value={form.turma}
                      onChange={handleChange}
                      label="Turma"
                    >
                      {opcoes.turmas?.map(turma => (
                        <MenuItem key={turma.value} value={turma.value}>
                          {turma.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Campo Disciplina (Texto) */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth required
                    name="disciplina"
                    label="Disciplina"
                    value={form.disciplina}
                    onChange={handleChange}
                    placeholder="Ex: Matemática, Português..."
                  />
                </Grid>

                {/* Campo Data da Aula (Data) */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth required
                    type="date"
                    name="data_aula"
                    label="Data da Aula"
                    value={form.data_aula}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }} // Mantém o rótulo em cima
                  />
                </Grid>

                {/* Campo Dia da Semana (Dropdown) */}
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Dia da Semana</InputLabel>
                    <Select
                      name="dia_semana"
                      value={form.dia_semana}
                      onChange={handleChange}
                      label="Dia da Semana"
                    >
                      {opcoes.dias_semana?.map(dia => (
                        <MenuItem key={dia.value} value={dia.value}>
                          {dia.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Campo Turno (Dropdown) */}
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Turno</InputLabel>
                    <Select
                      name="turno"
                      value={form.turno}
                      onChange={handleChange}
                      label="Turno"
                    >
                      {opcoes.turnos?.map(turno => (
                        <MenuItem key={turno.value} value={turno.value}>
                          {turno.label} {/* CORREÇÃO AQUI: era 'turma.label' */}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Campos de Horário (Início e Fim) */}
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth type="time" name="horario_inicio" label="Início"
                    value={form.horario_inicio} onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth type="time" name="horario_fim" label="Fim"
                    value={form.horario_fim} onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Campos de Texto Longo (Conteúdo, Atividades, Recursos, Observações) */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth multiline rows={3} name="conteudo"
                    label="Conteúdo Programado" value={form.conteudo} onChange={handleChange}
                    placeholder="Descreva o conteúdo que será ministrado..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth multiline rows={2} name="atividades"
                    label="Atividades Previstas" value={form.atividades} onChange={handleChange}
                    placeholder="Descreva as atividades planejadas..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth multiline rows={2} name="recursos"
                    label="Recursos Necessários" value={form.recursos} onChange={handleChange}
                    placeholder="Liste os recursos necessários..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth multiline rows={2} name="observacoes"
                    label="Observações" value={form.observacoes} onChange={handleChange}
                    placeholder="Observações adicionais..."
                  />
                </Grid>
              </Grid>
            </DialogContent>
            {/* Botões de Ação do Modal (Cancelar, Salvar) */}
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={handleCloseDialog} color="inherit">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="contained"
                // O botão 'Salvar' fica desabilitado se os campos obrigatórios não estiverem preenchidos
                disabled={!form.professor || !form.turma || !form.disciplina || !form.data_aula}
              >
                {editId ? "Atualizar" : "Salvar"} Planejamento
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </div>

      {/* Rodapé da página */}
      <FooterNine />
    </div>
  );
}