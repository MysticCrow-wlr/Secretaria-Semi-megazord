// EM: src/components/dashboard/ReservaSalas.jsx 

import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Grid, Typography, FormControl, InputLabel, Select, MenuItem, TextField } from "@mui/material";
import FooterNine from "../layout/footers/FooterNine";
import PageLinksTwo from "../common/PageLinksTwo";
import api from "@/api/axios";

// -----------------------------------------------------------------
// FUNÇÕES HELPER (Para autossuficiência do componente)
// -----------------------------------------------------------------
const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { console.error("Token de autenticação não encontrado."); return null; }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

// Definindo os Choices de Tipo de Sala (baseado no models.py)
const TIPO_CHOICES_RESERVA = [
    { value: '', label: 'Qualquer Tipo' },
    { value: 'SALA', label: 'Sala de Aula' },
    { value: 'LAB', label: 'Laboratório' },
    { value: 'QUADRA', label: 'Quadra/Esporte' },
];

// -----------------------------------------------------------------
// MODAL DE FORMULÁRIO DE RESERVA
// -----------------------------------------------------------------
function ReservaFormModal({ open, onClose, onSubmit, salas = [], userProfessorId}) {
    const [selectedTipo, setSelectedTipo] = useState(''); 
    const [submissionError, setSubmissionError] = useState(null);
    
    const initialForm = {
        professor: userProfessorId,
        sala: null,
        data: new Date().toISOString().split('T')[0],
        horario_inicio: '08:00', 
        horario_fim: '09:00', 
        finalidade: '',
    };
    const [form, setForm] = useState(initialForm);

    // Efeito para resetar o erro ao abrir o modal
    useEffect(() => {
        if (open) {
            setSubmissionError(null); 
        }
    }, [open]);

    // FILTRAGEM: Gera a lista de salas filtradas em tempo real
    const salasFiltradas = salas.filter(s => selectedTipo === '' || s.tipo === selectedTipo);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // LÓGICA DE FILTRO: Se o tipo mudar, resetar a sala selecionada
        if (name === 'tipo_filtro') {
            setSelectedTipo(value);
            setForm(prev => ({ ...prev, sala: null })); // Resetar a sala
            return;
        }

        // Lógica para campos normais
        const finalValue = name === 'sala' ? (value === '' ? null : Number(value)) : value;
        setForm(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmissionError(null);
        
        // Validação básica do Front-end
        if (!form.sala) {
            setSubmissionError("Selecione uma sala válida.");
            return;
        }
        
        onSubmit(form, setSubmissionError); 
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Reservar Sala/Laboratório</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2} mt={1}>
                        {/* CAMPO DE FILTRO POR TIPO */}
                        <Grid item xs={12}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Filtrar Tipo de Sala</InputLabel>
                                <Select 
                                    name="tipo_filtro" 
                                    label="Filtrar Tipo de Sala" 
                                    value={selectedTipo} 
                                    onChange={handleChange}
                                >
                                    {TIPO_CHOICES_RESERVA.map(t => (<MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        {/* CAMPO DE SELEÇÃO DE SALA (FILTRADO) */}
                        <Grid item xs={12}>
                            <FormControl fullWidth required size="small" disabled={salasFiltradas.length === 0}>
                                <InputLabel>Sala</InputLabel>
                                <Select 
                                    name="sala" 
                                    label="Sala" 
                                    value={form.sala || ""} 
                                    onChange={handleChange}
                                >
                                    <MenuItem value=""><em>Selecione a Sala</em></MenuItem>
                                    {/*  USAR TIPO_DISPLAY DO SERIALIZER PARA O RÓTULO LEGÍVEL */}
                                    {salasFiltradas.map(s => (
                                        <MenuItem key={s.id} value={s.id}>
                                            {s.nome} ({s.tipo_display || s.tipo}) 
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {salasFiltradas.length === 0 && (
                                <Typography variant="caption" color="error">Nenhuma sala disponível para o tipo selecionado.</Typography>
                            )}
                        </Grid>

                        {/* BLOC DE EXIBIÇÃO DE ERRO CENTRALIZADO */}
                        {submissionError && (
                            <Grid item xs={12}>
                                <Typography color="error" variant="body2" sx={{ p: 1, border: '1px solid red', borderRadius: 1 }}>
                                    🚨 Erro de Reserva: {submissionError}
                                </Typography>
                            </Grid>
                        )}
                        
                        <Grid item xs={12}>
                            <TextField name="data" label="Data da Reserva" type="date" value={form.data} onChange={handleChange} fullWidth required size="small" InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField name="horario_inicio" label="Início" type="time" value={form.horario_inicio} onChange={handleChange} fullWidth required size="small" InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField name="horario_fim" label="Fim" type="time" value={form.horario_fim} onChange={handleChange} fullWidth required size="small" InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField name="finalidade" label="Finalidade" value={form.finalidade} onChange={handleChange} fullWidth required multiline rows={2} size="small" />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions><Button onClick={onClose}>Cancelar</Button><Button type="submit" variant="contained">Reservar</Button></DialogActions>
            </form>
        </Dialog>
    );
}

// -----------------------------------------------------------------
// COMPONENTE PRINCIPAL (Visualização do Professor)
// -----------------------------------------------------------------
export default function ReservaSalas() {
    const [minhasReservas, setMinhasReservas] = useState([]);
    const [salas, setSalas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    const userProfessorId = 1;

    const fetchData = async () => {
        setLoading(true);
        const headers = getAuthHeaders();
        if (!headers) { setLoading(false); return; }
        try {
            const [reservasRes, salasRes] = await Promise.allSettled([
                api.get(`/reservas/=$ userProfessorId={userProfessorId}`, { headers }),
                api.get("/salas/", { headers }),
            ]);

            if (reservasRes.status === 'fulfilled') setMinhasReservas(reservasRes.value.data.results || reservasRes.value.data);
            if (salasRes.status === 'fulfilled') setSalas(salasRes.value.data.results || salasRes.value.data);

        } catch (error) { console.error("Erro ao buscar reservas:", error); } 
        finally { setLoading(false); }
    };
    
    useEffect(() => { fetchData(); }, []);

    const handleOpenModal = () => setModalOpen(true);
    const handleCloseModal = () => { setModalOpen(false); fetchData(); };

    const handleFormSubmit = async (formData, setSubmissionError) => {
        const headers = getAuthHeaders();
        try {
            await api.post("/reservas/", formData, { headers });
            window.alert("Sala reservada com sucesso!"); 
            handleCloseModal();
        } catch (error) {
            console.error("Erro ao criar reserva:", error.response?.data);
            
            let errorMessage = "Erro desconhecido ao processar reserva.";
            
            if (error.response && error.response.data) {
                const errorData = error.response.data;

                if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
                    errorMessage = errorData.non_field_errors[0]; 
                }
                else if (errorData.horario_fim) {
                    errorMessage = `Horário Inválido: ${errorData.horario_fim[0]}`;
                }

                else {
                    errorMessage = `Erro de Validação: ${JSON.stringify(errorData)}`;
                }
            }

            setSubmissionError(errorMessage);
        }
    };
    
    const handleDelete = async (id) => {
        if (!window.confirm("Confirmar cancelamento da reserva?")) return;
        const headers = getAuthHeaders();
        try {
            await api.delete(`/reservas/${id}/`, { headers });
            alert("Reserva cancelada.");
            fetchData();
        } catch (error) {
            alert("Erro ao cancelar reserva.");
        }
    };

    const getSalaNome = (salaId) => {
        const salaObj = salas.find(s => s.id === salaId);
        return salaObj ? salaObj.nome : 'Sala Desconhecida';
    };

    return (
        <div className="dashboard__main">
            <div className="dashboard__content bg-light-4">
                <div className="row pb-50 mb-10">
                    <div className="col-auto">
                        <h1 className="text-30 lh-12 fw-700">Reserva de Salas</h1>
                        <PageLinksTwo />
                    </div>
                </div>

                <div className="row y-gap-30">
                    <div className="col-12">
                        <div className="rounded-16 bg-white shadow-4 h-100">
                            <div className="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                                <h2 className="text-17 lh-1 fw-500">Minhas Reservas</h2>
                                <Button variant="contained" color="primary" onClick={handleOpenModal}>Nova Reserva</Button>
                            </div>

                            <div className="py-30 px-30">
                                {/* TABELA DE MINHAS RESERVAS */}
                                <Box>
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr><th>Sala</th><th>Data</th><th>Início</th><th>Fim</th><th>Finalidade</th><th>Ações</th></tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (<tr><td colSpan="6">Carregando reservas...</td></tr>) : minhasReservas.map(reserva => (
                                                <tr key={reserva.id}>
                                                    <td>{getSalaNome(reserva.sala)}</td>
                                                    <td>{reserva.data}</td>
                                                    <td>{reserva.horario_inicio}</td>
                                                    <td>{reserva.horario_fim}</td>
                                                    <td>{reserva.finalidade}</td>
                                                    <td>
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(reserva.id)}>Cancelar</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {minhasReservas.length === 0 && !loading && <tr><td colSpan="6" className="text-center">Nenhuma reserva agendada.</td></tr>}
                                        </tbody>
                                    </table>
                                </Box>
                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <FooterNine />
            
            <ReservaFormModal 
                open={modalOpen} 
                onClose={handleCloseModal} 
                onSubmit={handleFormSubmit} 
                salas={salas}
                userProfessorId={userProfessorId}
            />
        </div>
    );
}