// src/components/layout/component/Messages.jsx
import React, { useState, useEffect } from "react";
import { accordionItems } from "@/data/message";
import api from "@/api/axios";

// --- Imports do Material-UI ---
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";

// --- Helper de Autenticação ---
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

// --- Helper de Datas ---
const getTodayAndTomorrowStr = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
  const tomorrowStr = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD
  return { todayStr, tomorrowStr };
};

// --- URLs de placeholder para imagens ---
const PLACEHOLDER_IMAGES = {
  sistema: "https://placehold.co/40x40/d32f2f/FFFFFF?text=!",
  secretaria: "https://placehold.co/40x40/1976d2/FFFFFF?text=📆",
  default: "https://placehold.co/40x40/666666/FFFFFF?text=💬"
};
// -----------------------------

export default function Messages({ setMessageOpen, messageOpen }) {
  const [currentTab, setCurrentTab] = useState("message");
  const [openMessage, setOpenMessage] = useState(0);
  const [contactTabOpen, setContactTabOpen] = useState(1);

  // --- Estados dos Alunos ---
  const [alunosList, setAlunosList] = useState([]);
  const [loadingAlunos, setLoadingAlunos] = useState(true);
  const [selectedAlunoId, setSelectedAlunoId] = useState("");
  const [errorAlunos, setErrorAlunos] = useState(null);

  // --- Estados do Calendário ---
  const [rawCalendarEvents, setRawCalendarEvents] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [errorCalendar, setErrorCalendar] = useState(null);

  // --- Estados de Mensagens ---
  const [baseGroupsWithAlerts, setBaseGroupsWithAlerts] = useState(null);
  const [messageGroups, setMessageGroups] = useState(null);
  // ----------------------------------------

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  // --- Efeito para buscar os alunos ---
  useEffect(() => {
    const fetchAlunos = async () => {
      setLoadingAlunos(true);
      setErrorAlunos(null);
      const headers = getAuthHeaders();
      if (!headers) {
        setErrorAlunos("Não autenticado");
        setLoadingAlunos(false);
        return;
      }
      try {
        // CORREÇÃO: Removido o /api/ duplicado
        const res = await api.get("/alunos/", { headers });
        setAlunosList(res.data.results || res.data || []);
      } catch (err) {
        console.error("Erro ao buscar alunos:", err);
        setErrorAlunos("Erro ao carregar lista de alunos");
      } finally {
        setLoadingAlunos(false);
      }
    };
    fetchAlunos();
  }, []);

  // --- Efeito para buscar os eventos do Calendário ---
  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingCalendar(true);
      setErrorCalendar(null);
      const headers = getAuthHeaders();
      if (!headers) {
        setErrorCalendar("Não autenticado");
        setLoadingCalendar(false);
        return;
      }
      try {
        // CORREÇÃO: Removido o /api/ duplicado
        const response = await api.get("/eventos-calendario/", { headers });
        let eventList = [];
        if (response.data && Array.isArray(response.data.results)) {
          eventList = response.data.results;
        } else if (Array.isArray(response.data)) {
          eventList = response.data;
        }
        setRawCalendarEvents(eventList);
      } catch (error) {
        console.error("Erro ao buscar eventos do calendário (Messages):", error);
        setErrorCalendar("Erro ao carregar eventos do calendário");
      } finally {
        setLoadingCalendar(false);
      }
    };

    fetchEvents();
  }, []);

  // --- Efeito para processar eventos e criar alertas reais ---
  useEffect(() => {
    if (loadingCalendar) {
      return;
    }

    const { todayStr, tomorrowStr } = getTodayAndTomorrowStr();

    // 1. Filtra eventos de hoje ou amanhã
    const upcomingEvents = rawCalendarEvents.filter((event) => {
      const eventDate = event.data;
      return eventDate === todayStr || eventDate === tomorrowStr;
    });

    // 2. Clona os grupos de mensagens originais
    let newBase;
    try {
      newBase = JSON.parse(JSON.stringify(accordionItems || []));
    } catch (e) {
      console.error("Falha ao clonar accordionItems", e);
      newBase = [];
    }

    // 3. Garante que a estrutura mínima exista
    if (!Array.isArray(newBase) || newBase.length === 0) {
      console.warn("accordionItems estava vazio. Criando estrutura padrão.");
      newBase = [
        {
          id: 1,
          title: "All Messages",
          content: [],
        },
      ];
    }
    
    // Garante que o primeiro item tenha a propriedade 'content'
    if (newBase[0] && !Array.isArray(newBase[0].content)) {
      newBase[0].content = [];
    }

    // 4. Cria e adiciona as mensagens de alerta (se houver)
    if (upcomingEvents.length > 0) {
      const calendarAlerts = upcomingEvents.map((event) => {
        const isToday = event.data === todayStr;
        return {
          imageSrc: PLACEHOLDER_IMAGES.secretaria, // CORREÇÃO: URL fixa
          name: "Secretaria",
          message: `LEMBRETE: ${event.titulo} ${
            isToday ? "é hoje" : "é amanhã"
          }.`,
          time: "Hoje",
        };
      });

      // 5. Adiciona os novos alertas reais no topo do primeiro grupo
      if (newBase[0] && newBase[0].content) {
        calendarAlerts
          .reverse()
          .forEach((alert) => newBase[0].content.unshift(alert));
      }
    }

    // 6. Define o novo estado base E o estado de exibição
    setBaseGroupsWithAlerts(newBase);
    setMessageGroups(newBase);
    
  }, [rawCalendarEvents, loadingCalendar]);

  // --- Handler de Simulação ---
  const handleSimulateMessages = (event) => {
    const alunoId = event.target.value;
    setSelectedAlunoId(alunoId);

    if (!alunoId || !baseGroupsWithAlerts) {
      setMessageGroups(baseGroupsWithAlerts);
      return;
    }

    const aluno = alunosList.find((a) => a.id === alunoId);
    if (!aluno) return;

    const nomeResponsavel = aluno.responsavel_nome || "Responsável";
    const nomeAluno = aluno.name_aluno || "[Nome do Aluno]";
    const numFaltas = aluno.faltas_aluno || 0;

    // 1. Cria as mensagens de simulação
    const faltaMessage = {
      imageSrc: PLACEHOLDER_IMAGES.sistema, // CORREÇÃO: URL fixa
      name: "Sistema Acadêmico",
      message: `ALERTA ${nomeResponsavel}: O aluno(a) ${nomeAluno} atingiu ${numFaltas} faltas.`,
      time: "Agora",
    };

    const calendarMessage = {
      imageSrc: PLACEHOLDER_IMAGES.secretaria, // CORREÇÃO: URL fixa
      name: "Secretaria",
      message: `LEMBRETE ${nomeResponsavel}: Reunião de pais e mestres amanhã, 18h.`,
      time: "Agora",
    };

    // 2. Clona os grupos de mensagens base
    const newGroups = JSON.parse(JSON.stringify(baseGroupsWithAlerts));

    // 3. Adiciona as novas mensagens de SIMULAÇÃO no topo
    if (newGroups[0] && newGroups[0].content) {
      newGroups[0].content.unshift(faltaMessage);
      newGroups[0].content.unshift(calendarMessage);
    }

    // 4. Atualiza o estado para re-renderizar
    setMessageGroups(newGroups);
  };

  return (
    <aside
      className={`sidebar-menu toggle-element js-msg-toggle js-dsbh-sidebar-menu ${
        messageOpen ? "-is-el-visible" : ""
      }`}
    >
      <div className="sidebar-menu__bg"></div>

      <div className="sidebar-menu__content scroll-bar-1 py-30 px-40 sm:py-25 sm:px-20 bg-white -dark-bg-dark-1">
        <div className="row items-center justify-between mb-30">
          <div className="col-auto">
            <div className="-sidebar-buttons">
              <button
                data-sidebar-menu-button="messages"
                onClick={() => setCurrentTab("message")}
                className={`text-17 text-dark-1 fw-500 ${
                  currentTab == "message" ? "-is-button-active" : ""
                } `}
              >
                Messages
              </button>
            </div>
          </div>

          <div className="col-auto">
            <div className="row x-gap-10">
              <div className="col-auto">
                <button
                  data-sidebar-menu-target="settings"
                  onClick={() => setCurrentTab("settings")}
                  className="button -purple-3 text-purple-1 size-40 d-flex items-center justify-center rounded-full"
                >
                  <i className="icon-setting text-16"></i>
                </button>
              </div>
              <div className="col-auto">
                <button
                  data-sidebar-menu-target="contacts"
                  onClick={() => setCurrentTab("contacts")}
                  className="button -purple-3 text-purple-1 size-40 d-flex items-center justify-center rounded-full"
                >
                  <i className="icon-friend text-16"></i>
                </button>
              </div>
              <div className="col-auto">
                <button
                  data-el-toggle=".js-msg-toggle"
                  onClick={() => setMessageOpen(false)}
                  className="button -purple-3 text-purple-1 size-40 d-flex items-center justify-center rounded-full"
                >
                  <i className="icon-close text-14"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="relative js-menu-switch">
          <div
            data-sidebar-menu-open="messages"
            className={`sidebar-menu__item -sidebar-menu ${
              currentTab == "message" ? "-sidebar-menu-opened" : ""
            } `}
          >
            <form
              onSubmit={handleSubmit}
              className="search-field rounded-8 h-50"
            >
              <input
                required
                className="bg-light-3 pr-50"
                type="text"
                placeholder="Search Messages"
              />
              <button className="" type="submit">
                <i className="icon-search text-light-1 text-20"></i>
              </button>
            </form>

            {/* --- SELETOR DE SIMULAÇÃO --- */}
            <Box sx={{ mt: 2, mb: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="sim-aluno-label">
                  Simular Alertas Para:
                </InputLabel>
                <Select
                  labelId="sim-aluno-label"
                  value={selectedAlunoId}
                  label="Simular Alertas Para:"
                  onChange={handleSimulateMessages}
                  disabled={loadingAlunos || loadingCalendar}
                >
                  <MenuItem value="">
                    <em>
                      {loadingAlunos ? "Carregando..." : "Ninguém (Resetar)"}
                    </em>
                  </MenuItem>
                  {alunosList.map((aluno) => (
                    <MenuItem key={aluno.id} value={aluno.id}>
                      {aluno.name_aluno} (Resp: {aluno.responsavel_nome || "N/D"})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Mensagens de erro */}
              {errorAlunos && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {errorAlunos}
                </Alert>
              )}
              {errorCalendar && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  {errorCalendar}
                </Alert>
              )}
            </Box>

            {/* --- ÁREA DO ACORDEÃO --- */}
            <div className="accordion -block text-left pt-20 js-accordion">
              {loadingCalendar ? (
                <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                  <CircularProgress size={24} />
                  <span style={{ marginLeft: 8 }}>Carregando mensagens...</span>
                </Box>
              ) : !messageGroups ? (
                <div className="text-center text-dark-1 mt-20">
                  Carregando mensagens...
                </div>
              ) : messageGroups.length === 0 ? (
                <div className="text-center text-dark-1 mt-20">
                  Nenhum grupo de mensagem encontrado.
                </div>
              ) : (
                messageGroups.map((item, ind) => (
                  <div
                    key={item.id || ind}
                    onClick={() =>
                      setOpenMessage((prev) => (prev === item.id ? 0 : item.id))
                    }
                    className={`accordion__item border-light rounded-16 ${
                      openMessage === item.id ? "is-active" : ""
                    }`}
                  >
                    <div className="accordion__button">
                      <div className="accordion__icon size-30 -dark-bg-dark-2 mr-10">
                        <div className="icon d-flex items-center justify-center">
                          <span className="lh-1 fw-500">
                            {item.content ? item.content.length : 0}
                          </span>
                        </div>
                        <div className="icon d-flex items-center justify-center">
                          <span className="lh-1 fw-500">
                            {item.content ? item.content.length : 0}
                          </span>
                        </div>
                      </div>
                      <span className="text-17 fw-500 text-dark-1 pt-3">
                        {item.title || "Grupo de Mensagens"}
                      </span>
                    </div>

                    <div
                      className="accordion__content"
                      style={
                        openMessage === item.id ? { maxHeight: "340px" } : {}
                      }
                    >
                      <div className="accordion__content__inner pl-20 pr-20 pb-20">
                        {item.content && Array.isArray(item.content) && item.content.length > 0 ? (
                          item.content.map((contentItem, ind) => (
                            <div
                              key={ind}
                              data-sidebar-menu-target="messages-2"
                              onClick={() => setCurrentTab("messageTwo")}
                              className="row x-gap-10 y-gap-10 pointer"
                            >
                              <div className="col-auto">
                                <img
                                  src={contentItem.imageSrc || PLACEHOLDER_IMAGES.default}
                                  alt="image"
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                  }}
                                  onError={(e) => {
                                    e.target.src = PLACEHOLDER_IMAGES.default;
                                  }}
                                />
                              </div>
                              
                              <div className="col">
                                <div className="text-15 lh-12 fw-500 text-dark-1 pt-8">
                                  {contentItem.name}
                                </div>
                                <div className="text-14 lh-1 mt-5">
                                  <span className="text-dark-1">
                                    {contentItem.name === "Sistema Acadêmico" ||
                                    contentItem.name === "Secretaria"
                                      ? ""
                                      : "You:"}
                                  </span>
                                  {" "}
                                  {contentItem.message}
                                </div>
                              </div>

                              <div className="col-auto">
                                <div className="text-13 lh-12 pt-8">
                                  {contentItem.time}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-dark-1">Nenhuma mensagem neste grupo.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Outras abas... */}
          <div
            data-sidebar-menu-open="messages-2"
            className={`sidebar-menu__item -sidebar-menu ${
              currentTab == "messageTwo" ? "-sidebar-menu-opened" : ""
            }`}
          >
            {/* conteúdo do chat individual */}
          </div>

          <div
            data-sidebar-menu-open="contacts"
            className={`sidebar-menu__item -sidebar-menu ${
              currentTab == "contacts" ? "-sidebar-menu-opened" : ""
            }`}
          >
            {/* conteúdo dos contatos */}
          </div>

          <div
            data-sidebar-menu-open="settings"
            className={`sidebar-menu__item -sidebar-menu ${
              currentTab == "settings" ? "-sidebar-menu-opened" : ""
            }`}
          >
            {/* conteúdo das configurações */}
          </div>
        </div>
      </div>
    </aside>
  );
}