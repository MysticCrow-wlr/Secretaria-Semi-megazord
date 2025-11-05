// src/pages/dashboard/dshb-dashboard/index.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import api from "@/api/axios";
import html2canvas from 'html2canvas';

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
    Cell,
} from "recharts";
import {
    Box,
    Grid,
    Typography,
    Paper,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Modal,
    Button,
    TextField,
} from "@mui/material";

import { Warning, Block, AssignmentLate, Edit, Download } from "@mui/icons-material";

// USANDO IMPORTAÇÃO PADRÃO (CORRETA para export default)
import Sidebar from "@/components/dashboard/Sidebar";
import HeaderDashboard from "@/components/layout/headers/HeaderDashboard";
import FooterNine from "@/components/layout/footers/FooterNine";

// --- CONSTANTES ---

const TURMA_CHOICES = [
    { value: "1A", label: "1 ANO A" },
    { value: "1B", label: "1 ANO B" },
    { value: "1C", label: "1 ANO C" },
    { value: "2A", label: "2 ANO A" },
    { value: "2B", label: "2 ANO B" },
    { value: "2C", label: "2 ANO C" },
    { value: "3A", label: "3 ANO A" },
    { value: "3B", label: "3 ANO B" },
    { value: "3C", label: "3 ANO C" },
];

const DISCIPLINA_CHOICES = [
    { value: "LING", label: "Linguagens" },
    { value: "CH", label: "Ciências Humanas" },
    { value: "CN", label: "Ciências da Natureza" },
    { value: "MAT", label: "Matemática" },
    { value: "DS", label: "Itinerário técnico" },
];
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
const SUBJECT_COLORS = {
    'LING': '#8884d8',
    'CH': '#82ca9d',
    'CN': '#ffc658',
    'MAT': '#d32f2f',
    'DS': '#1976d2',
};

// --- FUNÇÃO UTILITÁRIA ---

const getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        console.error("Token de autenticação não encontrado.");
        return null;
    }
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
};

// --- COMPONENTE PRINCIPAL ---

export default function DshbDashboard() {
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [allStudents, setAllStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [student, setStudent] = useState(null);
    const [grades, setGrades] = useState([]);
    const [performanceHistory, setPerformanceHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ESTADOS DOS FILTROS
    const [filterTurma, setFilterTurma] = useState("");
    const [filterCpf, setFilterCpf] = useState("");

    // ESTADOS DO MODAL DE EDIÇÃO
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editComment, setEditComment] = useState("");

    // Ref para o container do relatório que será capturado
    const reportContainerRef = useRef(null);


    useEffect(() => {
        const fetchAllStudents = async () => {
            setLoadingStudents(true);
            const headers = getAuthHeaders();
            if (!headers) {
                setError("Não autenticado.");
                setLoadingStudents(false);
                return;
            }
            try {
                const res = await api.get("/alunos/", { headers });
                setAllStudents(res.data.results || res.data || []);
            } catch (err) {
                console.error("Erro ao buscar lista de alunos:", err);
                setError("Não foi possível carregar a lista de alunos.");
                setAllStudents([]);
            } finally {
                setLoadingStudents(false);
            }
        };
        fetchAllStudents();
    }, []);

    // LÓGICA DE FILTRAGEM (MEMOIZADA)
    const filteredStudents = useMemo(() => {
        let tempStudents = allStudents;

        if (filterTurma) {
            tempStudents = tempStudents.filter(
                (aluno) => aluno.class_choice === filterTurma
            );
        }

        if (filterCpf) {
            const cpfSanitized = filterCpf.replace(/[^0-9]/g, '');
            tempStudents = tempStudents.filter(
                (aluno) => aluno.cpf_aluno && aluno.cpf_aluno.includes(cpfSanitized)
            );
        }

        return tempStudents;
    }, [allStudents, filterTurma, filterCpf]);


    useEffect(() => {
        if (!selectedStudentId) {
            setStudent(null);
            setGrades([]);
            setPerformanceHistory([]);
            setLoading(false);
            setError(null);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            const headers = getAuthHeaders();
            if (!headers) {
                setError("Não autenticado.");
                setLoading(false);
                return;
            }

            try {
                const [studentRes, gradesRes, advRes, suspRes] =
                    await Promise.allSettled([
                        api.get(`/alunos/${selectedStudentId}/`, { headers }),
                        api.get(`/notas/?aluno=${selectedStudentId}`, { headers }),
                        api.get(`/advertencias/?aluno=${selectedStudentId}`, { headers }),
                        api.get(`/suspensoes/?aluno=${selectedStudentId}`, { headers }),
                    ]);

                if (studentRes.status === "fulfilled") {
                    setStudent(studentRes.value.data);
                } else {
                    throw new Error("Falha ao buscar dados do aluno.");
                }

                if (gradesRes.status === "fulfilled") {
                    const rawNotas = gradesRes.value.data.results || gradesRes.value.data || [];
                    setGrades(Array.isArray(rawNotas) ? rawNotas : []);
                } else {
                    console.error("Erro ao buscar notas:", gradesRes.reason);
                    setGrades([]);
                }

                let combinedHistory = [];
                if (advRes.status === "fulfilled") {
                    const rawData = advRes.value.data.results || advRes.value.data || [];
                    const advertencias = (Array.isArray(rawData) ? rawData : []).map((item) => ({
                        ...item,
                        tipo: "Advertência",
                        data: item.data,
                        motivoLabel: ADV_CHOICES.find((opt) => opt.value === item.motivo)?.label || item.motivo,
                    }));
                    combinedHistory = combinedHistory.concat(advertencias);
                }

                if (suspRes.status === "fulfilled") {
                    const rawData = suspRes.value.data.results || suspRes.value.data || [];
                    const suspensoes = (Array.isArray(rawData) ? rawData : []).map((item) => ({
                        ...item,
                        tipo: "Suspensão",
                        data: item.data_inicio,
                        motivoLabel: SUSP_CHOICES.find((opt) => opt.value === item.motivo)?.label || item.motivo,
                    }));
                    combinedHistory = combinedHistory.concat(suspensoes);
                }

                combinedHistory.sort((a, b) => new Date(b.data) - new Date(a.data));
                setPerformanceHistory(combinedHistory);

            } catch (err) {
                console.error("Erro ao carregar dados do dashboard:", err);
                setError(err.message || "Um erro ocorreu.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedStudentId]);

    const handleStudentChange = (event) => {
        setSelectedStudentId(event.target.value);
    };

    const handleOpenEditModal = () => {
        if (student) {
            setEditComment(student.comentario_descritivo || "");
            setIsModalOpen(true);
        }
    };

    const handleCloseEditModal = () => {
        setIsModalOpen(false);
        setEditComment("");
    };

    const handleSaveComment = async () => {
        if (!selectedStudentId || !student) return;

        setLoading(true);
        const headers = getAuthHeaders();
        if (!headers) {
            setError("Não autenticado.");
            setLoading(false);
            return;
        }

        try {
            const payload = {
                Responsavel: student.Responsavel,
                // Assumimos que o Responsavel FK ID é necessário
                comentario_descritivo: editComment
            };

            await api.patch(`/alunos/${selectedStudentId}/`, payload, { headers });

            setStudent(prev => ({
                ...prev,
                comentario_descritivo: editComment
            }));

            handleCloseEditModal();
        } catch (err) {
            console.error("Erro ao salvar comentário:", err.response ? err.response.data : err);
            const apiError = err.response?.data?.Responsavel || "Falha ao salvar. Verifique se o campo Responsável é obrigatório.";
            setError(apiError);
        } finally {
            setLoading(false);
        }
    };

    const handleCaptureScreenshot = () => {
        if (!reportContainerRef.current) {
            console.error("Erro: Container do relatório não encontrado.");
            return;
        }

        // Usa o nome do aluno para o arquivo, se disponível
        const studentName = student ? student.name_aluno.replace(/ /g, '_') : 'relatorio';
        const filename = `Relatorio_Aluno_${studentName}.png`;

        console.log("Iniciando captura do relatório...");
        setLoading(true); // Mostra um feedback de carregamento

        html2canvas(reportContainerRef.current, {
            useCORS: true, // Tenta carregar imagens de outros domínios (se houver)
            logging: true, // Loga informações de debug no console
            scale: 2 // Aumenta a escala para uma imagem de melhor qualidade
        }).then((canvas) => {
            // Cria um link <a> temporário
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');

            // Simula o clique para iniciar o download
            link.click();

            console.log("Download do relatório iniciado.");
            setLoading(false);
        }).catch((err) => {
            console.error("Erro ao gerar screenshot:", err);
            setError("Falha ao gerar o relatório em imagem.");
            setLoading(false);
        });
    };

    return (
        <>
            <HeaderDashboard />
            <div className="content-wrapper js-content-wrapper overflow-hidden">
                <div
                    id="dashboardOpenClose"
                    className="dashboard -home-9 js-dashboard-home-9"
                >
                    <div className="dashboard__sidebar scroll-bar-1">
                        <Sidebar />
                    </div>

                    <div className="dashboard__main">
                        <div className="dashboard__content bg-light-4">

                            {/* SEÇÃO DE FILTRO E SELEÇÃO DE ALUNO */}
                            <Box sx={{ padding: 3, pb: 0 }}>
                                <Paper elevation={2} sx={{ padding: 2 }}>
                                    <Grid container spacing={2} alignItems="center">

                                        {/* Filtro por Turma */}
                                        <Grid item xs={12} sm={4}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel id="filter-turma-label">Filtrar por Turma</InputLabel>
                                                <Select
                                                    labelId="filter-turma-label"
                                                    value={filterTurma}
                                                    label="Filtrar por Turma"
                                                    onChange={(e) => setFilterTurma(e.target.value)}
                                                >
                                                    <MenuItem value="">
                                                        <em>Todas as Turmas</em>
                                                    </MenuItem>
                                                    {TURMA_CHOICES.map((option) => (
                                                        <MenuItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        {/* Filtro por CPF */}
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Filtrar por CPF"
                                                value={filterCpf}
                                                onChange={(e) => setFilterCpf(e.target.value)}
                                                placeholder="Digite o CPF..."
                                            />
                                        </Grid>

                                        {/* Seletor do Aluno */}
                                        <Grid item xs={12} sm={4}>
                                            <FormControl fullWidth>
                                                <InputLabel id="student-select-label">Selecione um Aluno</InputLabel>
                                                <Select
                                                    labelId="student-select-label"
                                                    id="student-select"
                                                    value={selectedStudentId}
                                                    label="Selecione um Aluno"
                                                    onChange={handleStudentChange}
                                                    disabled={loadingStudents}
                                                >
                                                    <MenuItem value="">
                                                        <em>{loadingStudents ? "Carregando alunos..." : "Selecione..."}</em>
                                                    </MenuItem>
                                                    {/* USA A LISTA FILTRADA */}
                                                    {filteredStudents.map((aluno) => (
                                                        <MenuItem key={aluno.id} value={aluno.id}>
                                                            {aluno.name_aluno} (Turma: {aluno.class_choice || 'N/D'})
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                    </Grid>
                                </Paper>
                            </Box>
                            {/* FIM DA SEÇÃO DE FILTROS */}

                            {loading && (
                                <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                                    <CircularProgress />
                                    <Typography ml={2}>Carregando dados do aluno...</Typography>
                                </Box>
                            )}
                            {error && !loading && (
                                <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                                    <Typography color="error">{error}</Typography>
                                </Box>
                            )}
                            {!loading && !error && !selectedStudentId && (
                                <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                                    <Typography color="textSecondary">
                                        Por favor, selecione um aluno no menu acima para ver o dashboard.
                                    </Typography>
                                </Box>
                            )}

                            {/* INÍCIO DA ÁREA CAPTURÁVEL */}
                            {!loading && !error && selectedStudentId && (
                                <>
                                    {/* Botão de Download */}
                                    <Box sx={{ padding: 3, pb: 0, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            onClick={handleCaptureScreenshot}
                                            startIcon={<Download />}
                                            disabled={loading} // Desativa enquanto salva ou carrega
                                        >
                                            Baixar Relatório como Imagem
                                        </Button>
                                    </Box>

                                    {/* A ref é adicionada a este Grid, que contém todos os relatórios */}
                                    <Grid container spacing={3} sx={{ padding: 3 }} ref={reportContainerRef}>

                                        {/* COLUNA ESQUERDA (GRÁFICO, STATUS E COMENTÁRIOS) */}
                                        <Grid item xs={12} md={8}>
                                            <Grid container spacing={3} direction="column">

                                                {/* LINHA 1: GRÁFICO DE NOTAS */}
                                                <Grid item xs={12}>
                                                    <Paper elevation={3} sx={{ padding: 2, height: "450px" }}>
                                                        <Typography variant="h6" gutterBottom>
                                                            Gráfico de Notas
                                                        </Typography>
                                                        <GradesChart data={grades} />
                                                    </Paper>
                                                </Grid>

                                                {/* LINHA 2: STATUS E COMENTÁRIOS (LADO A LADO) */}
                                                <Grid item xs={12}>
                                                    <Grid container spacing={3}>

                                                        {/* Item 2A: STATUS DE APROVAÇÃO (ESQUERDA) */}
                                                        <Grid item xs={12} md={6}>
                                                            <ApprovalStatus student={student} grades={grades} />
                                                        </Grid>

                                                        {/* Item 2B: COMENTÁRIOS DESCRITIVOS (DIREITA) */}
                                                        <Grid item xs={12} md={6}>
                                                            <Paper elevation={3} sx={{ padding: 2 }}>
                                                                <DescriptiveComment
                                                                    student={student}
                                                                    onEditComment={handleOpenEditModal}
                                                                />
                                                            </Paper>
                                                        </Grid>

                                                    </Grid>
                                                </Grid>

                                            </Grid>
                                        </Grid>

                                        {/* COLUNA DIREITA (RELATÓRIOS: Presença, Faltas, Histórico) */}
                                        <Grid item xs={12} md={4}>
                                            <Grid container spacing={3} direction="column">

                                                {/* Relatório de Presença */}
                                                <Grid item>
                                                    <Paper elevation={3} sx={{ padding: 2 }}>
                                                        <PresenceReport student={student} />
                                                    </Paper>
                                                </Grid>

                                                {/* Relatório de Faltas */}
                                                <Grid item>
                                                    <Paper elevation={3} sx={{ padding: 2 }}>
                                                        <AbsencesReport student={student} />
                                                    </Paper>
                                                </Grid>

                                                {/* Relatório de Desempenho */}
                                                <Grid item>
                                                    <Paper elevation={3} sx={{ padding: 2 }}>
                                                        <PerformanceReport history={performanceHistory} />
                                                    </Paper>
                                                </Grid>

                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </>
                            )}

                        </div>

                        <FooterNine />

                    </div>
                </div>
            </div>

            {/* MODAL DE EDIÇÃO DE COMENTÁRIO */}
            <Modal
                open={isModalOpen}
                onClose={handleCloseEditModal}
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 500,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 2,
                }}>
                    <Typography id="modal-title" variant="h6" component="h2" gutterBottom>
                        Editar Comentário Descritivo
                    </Typography>
                    {student && (
                        <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 2 }}>
                            Aluno: {student.name_aluno}
                        </Typography>
                    )}

                    <TextField
                        label="Comentário"
                        multiline
                        rows={6}
                        fullWidth
                        variant="outlined"
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        sx={{ mb: 3 }}
                    />

                    <Box display="flex" justifyContent="flex-end" gap={2}>
                        <Button
                            onClick={handleCloseEditModal}
                            variant="outlined"
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveComment}
                            variant="contained"
                            color="primary"
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : "Salvar Comentário"}
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </>
    );
}

// ----------------------------------------------------
// --- COMPONENTES DE RELATÓRIO (Definição Fora do DshbDashboard) ---
// ----------------------------------------------------

function GradesChart({ data }) {
    const groupedData = data.reduce((acc, nota) => {
        const disciplinaValue = nota.disciplina;
        const disciplinaLabel = DISCIPLINA_CHOICES.find((d) => d.value === disciplinaValue)?.label || disciplinaValue;
        const valor = parseFloat(nota.valor);
        if (isNaN(valor)) return acc;

        if (!acc[disciplinaValue]) {
            acc[disciplinaValue] = { total: 0, count: 0, disciplinaLabel: disciplinaLabel, disciplinaValue: disciplinaValue };
        }

        acc[disciplinaValue].total += valor;
        acc[disciplinaValue].count += 1;
        return acc;
    }, {});

    const chartData = Object.values(groupedData).map((item) => ({
        disciplina: item.disciplinaLabel,
        nota: (item.total / item.count).toFixed(2),
        value: item.disciplinaValue
    }));

    if (chartData.length === 0) {
        return <Box display="flex" justifyContent="center" alignItems="center" height="90%"><Typography>Nenhuma nota encontrada.</Typography></Box>;
    }

    return (
        <ResponsiveContainer width="100%" height="90%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="disciplina" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="nota" name="Média da Nota">
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SUBJECT_COLORS[entry.value] || '#808080'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

function ApprovalStatus({ student, grades }) {
    const MIN_GRADE_REQUIRED = 6.0;
    const MIN_ATTENDANCE_PERCENTAGE = 0.75; // 75%

    if (!student || grades.length === 0) {
        return (
            <Paper elevation={3} sx={{ padding: 2, borderLeft: '5px solid lightgray', height: '100%' }}>
                <Typography variant="h6" color="textSecondary">
                    Status de Aprovação
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Dados incompletos para cálculo.
                </Typography>
            </Paper>
        );
    }

    // --- 1. CÁLCULO DA MÉDIA GERAL ---
    const totalGradesValue = grades.reduce((sum, nota) => sum + (parseFloat(nota.valor) || 0), 0);
    const totalGradesCount = grades.length;
    const averageGrade = totalGradesCount > 0 ? totalGradesValue / totalGradesCount : 0;
    const isGradeApproved = averageGrade >= MIN_GRADE_REQUIRED;

    // --- 2. CÁLCULO DA FREQUÊNCIA (USANDO PRESENÇAS + FALTAS) ---
    const presencas = student.presencas_aluno || 0;
    const faltas = student.faltas_aluno || 0;
    const aulasOcorridas = presencas + faltas;
    const attendancePercentage = aulasOcorridas > 0 ? presencas / aulasOcorridas : 0;
    const isAttendanceApproved = attendancePercentage >= MIN_ATTENDANCE_PERCENTAGE;

    // --- 3. STATUS FINAL ---
    const isApproved = isGradeApproved && isAttendanceApproved;
    const statusText = isApproved ? "APROVADO" : "NÃO APROVADO";
    const statusColor = isApproved ? "success.main" : "error.main";
    const statusBgColor = isApproved ? "#e8f5e9" : "#ffebee";

    return (
        <Paper
            elevation={3}
            sx={{
                padding: 2,
                backgroundColor: statusBgColor,
                borderLeft: `5px solid ${isApproved ? '#4caf50' : '#f44336'}`,
                height: '100%'
            }}
        >
            <Typography variant="h6" sx={{ color: statusColor }}>
                Status de Aprovação
            </Typography>
            <Typography variant="h4" sx={{ color: statusColor, mt: 1 }}>
                {statusText}
            </Typography>
            <Box sx={{ mt: 2, fontSize: '0.9rem' }}>
                <Typography variant="body2">
                    Média Geral ({MIN_GRADE_REQUIRED.toFixed(1)}+):
                    <strong style={{ color: isGradeApproved ? '#4caf50' : '#f44336', marginLeft: 4 }}>
                        {averageGrade.toFixed(2)} ({isGradeApproved ? 'OK' : 'FALHA'})
                    </strong>
                </Typography>
                <Typography variant="body2">
                    Frequência ({(MIN_ATTENDANCE_PERCENTAGE * 100).toFixed(0)}%+):
                    <strong style={{ color: isAttendanceApproved ? '#4caf50' : '#f44336', marginLeft: 4 }}>
                        {(attendancePercentage * 100).toFixed(1)}% (Base {aulasOcorridas} Aulas) ({isAttendanceApproved ? 'OK' : 'FALHA'})
                    </strong>
                </Typography>
            </Box>
        </Paper>
    );
}


function DescriptiveComment({ student, onEditComment }) {
    if (!student) return null;

    // LÓGICA DE PERMISSÃO TEMPORÁRIA (Substitua pela sua lógica real)
    const canEdit = true;

    const comment = student.comentario_descritivo || "Ainda não há um comentário descritivo para este aluno.";
    const isPlaceholder = !student.comentario_descritivo;

    return (
        <>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1.5 }}
            >
                <Typography variant="h6">
                    Comentários Descritivos
                </Typography>

                {canEdit && (
                    <Button
                        onClick={onEditComment}
                        size="small"
                        variant="outlined"
                        startIcon={<Edit />}
                    >
                        Editar
                    </Button>
                )}
            </Box>

            <Paper
                elevation={1}
                sx={{
                    padding: 2,
                    backgroundColor: isPlaceholder ? '#fff3e0' : 'background.default',
                    borderLeft: '4px solid',
                    borderColor: isPlaceholder ? '#ff9800' : '#1976d2',
                    fontStyle: isPlaceholder ? 'italic' : 'normal',
                    whiteSpace: 'pre-wrap'
                }}
            >
                <Typography variant="body2" color={isPlaceholder ? 'textSecondary' : 'textPrimary'}>
                    {comment}
                </Typography>
            </Paper>
            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.disabled' }}>
                Última avaliação de performance pela Coordenação.
            </Typography>
        </>
    );
}


function PresenceReport({ student }) {
    if (!student) return null;

    const presencas = student.presencas_aluno || 0;
    const faltas = student.faltas_aluno || 0;

    // CÁLCULO CORRIGIDO: Aulas Ocorridas = Presenças + Faltas
    const aulasOcorridas = presencas + faltas;

    let taxaPresenca = 0;
    if (aulasOcorridas > 0) {
        taxaPresenca = (presencas / aulasOcorridas) * 100;
    }

    // CORREÇÃO: Variável indicatorColor precisa ser definida antes de ser usada no JSX
    let indicatorColor = "#82ca9d";
    if (taxaPresenca < 75) {
        indicatorColor = "#ffc658";
    }
    if (taxaPresenca < 50) {
        indicatorColor = "#d32f2f";
    }

    return (
        <>
            <Typography variant="h6" gutterBottom>
                Relatório de Presença
            </Typography>
            <Typography variant="h4" gutterBottom color={indicatorColor}>
                {taxaPresenca.toFixed(1)}%
                <span style={{ fontSize: '1.2rem', marginLeft: '8px', color: 'textSecondary' }}>Taxa</span>
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
                Aluno: {student.name_aluno}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
                Turma: {student.class_choice}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
                Aulas totais: 200
            </Typography>
            <Box sx={{ mt: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {presencas} Presenças / {aulasOcorridas} Aulas Ocorridas
                </Typography>
                <Typography variant="caption" color="textSecondary">
                    Presenças / Aulas Totais Acumuladas
                </Typography>
                <Box sx={{ width: "100%", backgroundColor: "#e0e0e0", borderRadius: "4px", mt: 1 }}>
                    <Box sx={{
                        width: `${Math.min(taxaPresenca, 100)}%`,
                        backgroundColor: indicatorColor,
                        height: "10px",
                        borderRadius: "4px",
                    }}
                    />
                </Box>
            </Box>
        </>
    );
}

function AbsencesReport({ student }) {
    if (!student) return null;
    const faltas = student.faltas_aluno || 0;
    const limiteFaltas = 50;
    const percentage = (faltas / limiteFaltas) * 100;
    return (
        <>
            <Typography variant="h6" gutterBottom>
                Relatório de Faltas
            </Typography>
            <Typography variant="h4" gutterBottom>
                {faltas} <span style={{ fontSize: '1.2rem' }}>faltas</span>
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
                Aluno: {student.name_aluno}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
                Turma: {student.class_choice}
            </Typography>
            <Box sx={{ mt: 2 }}>
                <Typography variant="caption">
                    {`Uso do limite de ${limiteFaltas} faltas:`}
                </Typography>
                <Box sx={{ width: "100%", backgroundColor: "#e0e0e0", borderRadius: "4px" }}>
                    <Box sx={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: percentage > 75 ? "#d32f2f" : "#1976d2",
                        height: "10px",
                        borderRadius: "4px",
                    }}
                    />
                </Box>
            </Box>
        </>
    );
}

function PerformanceReport({ history }) {
    const recentHistory = history.slice(0, 5);
    return (
        <>
            <Typography variant="h6" gutterBottom>
                Histórico
            </Typography>
            <List dense>
                {recentHistory.length === 0 ? (
                    <ListItem>
                        <ListItemIcon><AssignmentLate /></ListItemIcon>
                        <ListItemText primary="Nenhum evento disciplinar registrado." />
                    </ListItem>
                ) : (
                    recentHistory.map((item) => (
                        <ListItem key={`${item.tipo}-${item.id}`}>
                            <ListItemIcon>
                                {item.tipo === "Advertência" ? <Warning color="warning" /> : <Block color="error" />}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.motivoLabel}
                                secondary={`${item.tipo} em ${new Date(item.data).toLocaleDateString("pt-BR")}`}
                            />
                        </ListItem>
                    ))
                )}
            </List>
        </>
    );
}