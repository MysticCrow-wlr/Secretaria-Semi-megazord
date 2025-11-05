# secretaria/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .permissions import IsSecretaria
from django.contrib.auth.models import User, Group
from django.db import transaction
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
import random
import string
from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime, timedelta
from django.utils import timezone
import uuid

# --- CORREÇÃO APLICADA AQUI ---
# Adicionamos PasswordResetToken à lista de modelos importados.
from .models import (
    Responsavel, Aluno, Professor, Bimestre, Nota, AtividadePendente,
    EventoExtracurricular, Advertencia, Suspensao, EventoExtracurricular, 
    PlanejamentoSemanal, Advertencia, Suspensao,EventoCalendario, 
    EmprestimoLivro, Livro, PasswordResetToken, Sala, Reserva
)
# ---------------------------------

from .serializers import (
    ResponsavelSerializer, AlunoSerializer, ProfessorSerializer, BimestreSerializer,
    NotaSerializer, AtividadePendenteSerializer, EventoExtracurricularSerializer,
    AdvertenciaSerializer, SuspensaoSerializer,
    PlanejamentoSemanalSerializer, AdvertenciaSerializer, SuspensaoSerializer,
    EventoCalendarioSerializer, EmprestimoLivroSerializer, LivroSerializer, 
    SalaSerializer, ReservaSerializer
)
from .permissions import IsSecretaria, IsProfessor, IsResponsavel, IsAluno, IsAuxiliarAdmin
from rest_framework.decorators import action


def get_professor_by_user(user):
    """Tenta obter o objeto Professor associado ao usuário logado."""
    try:
        return Professor.objects.get(user=user)
    except Professor.DoesNotExist:
        return None


# Funções de views HTML
def calendario_academico(request):
    eventos = EventoCalendario.objects.order_by('data')
    return render(request, 'calendario.html', {'eventos': eventos})

def media_aluno_disciplina(request, aluno_id, disciplina):
    aluno = get_object_or_404(Aluno, id=aluno_id)
    media = aluno.media_por_disciplina(disciplina)
    return render(request, 'media_aluno.html', {
        'aluno': aluno,
        'disciplina': disciplina,
        'media': media,
    })


# ViewSets de CRUD Total (Apenas para a Secretaria)
class ResponsavelViewSet(viewsets.ModelViewSet):
    queryset = Responsavel.objects.all()
    serializer_class = ResponsavelSerializer
    permission_classes = [IsSecretaria]

class ProfessorViewSet(viewsets.ModelViewSet):
    queryset = Professor.objects.all()
    serializer_class = ProfessorSerializer
    permission_classes = [IsSecretaria]

class AlunoViewSet(viewsets.ModelViewSet):
    queryset = Aluno.objects.all()
    serializer_class = AlunoSerializer
    
    def get_permissions(self):
        # Permissão de escrita (create, update) continua APENAS para Secretaria
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsSecretaria]
        # 🟢 CORREÇÃO: Permite Leitura (GET) para Secretaria E Auxiliar Admin
        elif self.action in ['list', 'retrieve']: 
            self.permission_classes = [IsSecretaria | IsAuxiliarAdmin] # Permissão combinada para leitura
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

# ViewSets com Permissões Múltiplas e Filtros de Objeto
class NotaViewSet(viewsets.ModelViewSet):
    queryset = Nota.objects.all()
    serializer_class = NotaSerializer

    def get_queryset(self):
        user = self.request.user
        # Se for Secretaria ou Professor, veja tudo.
        if IsSecretaria().has_permission(self.request, self) or IsProfessor().has_permission(self.request, self):
            return Nota.objects.all()
        # Se for Responsável ou Aluno, veja apenas o relacionado.
        elif IsResponsavel().has_permission(self.request, self):
            return Nota.objects.filter(aluno__Responsavel__user=user)
        elif IsAluno().has_permission(self.request, self):
            return Nota.objects.filter(aluno__user=user)
        
        return Nota.objects.none()

    def get_permissions(self):
        # Apenas Secretaria e Professor podem criar/editar/excluir notas
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsSecretaria | IsProfessor]
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

class AtividadePendenteViewSet(viewsets.ModelViewSet):
    queryset = AtividadePendente.objects.all()
    serializer_class = AtividadePendenteSerializer

    def get_queryset(self):
        user = self.request.user
        # Secretaria e Professor veem todas as tarefas.
        if IsSecretaria().has_permission(self.request, self) or IsProfessor().has_permission(self.request, self):
            return AtividadePendente.objects.all()
        # Responsáveis/Alunos veem apenas as suas.
        elif IsResponsavel().has_permission(self.request, self):
            return AtividadePendente.objects.filter(aluno__Responsavel__user=user)
        elif IsAluno().has_permission(self.request, self):
            return AtividadePendente.objects.filter(aluno__user=user)
        
        return AtividadePendente.objects.none()

    def get_permissions(self):
        # Ação: Criar e Gerenciar tarefas (CRUD) permitido para Secretaria E Professor
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsSecretaria | IsProfessor]
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

# ... (Restante das suas Views originais) ...

class PlanejamentoSemanalViewSet(viewsets.ModelViewSet):
    queryset = PlanejamentoSemanal.objects.all()
    serializer_class = PlanejamentoSemanalSerializer

@api_view(['GET'])
def planejamento_opcoes(request):
    opcoes = {   
        'dias_semana': [
            {'value': 'SEG', 'label': 'Segunda-feira'},
            {'value': 'TER', 'label': 'Terça-feira'},
            {'value': 'QUA', 'label': 'Quarta-feira'},
            {'value': 'QUI', 'label': 'Quinta-feira'},
            {'value': 'SEX', 'label': 'Sexta-feira'},
            {'value': 'SAB', 'label': 'Sábado'},
        ],
        'turnos': [
            {'value': 'MANHA', 'label': 'Manhã'},
            {'value': 'TARDE', 'label': 'Tarde'}, 
            {'value': 'NOITE', 'label': 'Noite'},
        ],
        'turmas': [
            {'value': '1A', 'label': '1 ANO A'},
            {'value': '1B', 'label': '1 ANO B'},
            {'value': '1C', 'label': '1 ANO C'},
            {'value': '2A', 'label': '2 ANO A'},
            {'value': '2B', 'label': '2 ANO B'},
            {'value': '2C', 'label': '2 ANO C'},
            {'value': '3A', 'label': '3 ANO A'},
            {'value': '3B', 'label': '3 ANO B'},
            {'value': '3C', 'label': '3 ANO C'},
        ]
    }
    return Response(opcoes)

class AdvertenciaViewSet(viewsets.ModelViewSet):
    queryset = Advertencia.objects.all()
    serializer_class = AdvertenciaSerializer

    def get_queryset(self):
        # Lógica de filtro para leitura: (Quem pode ver?)
        # Secretaria/Professor veem tudo; Aluno/Responsável veem apenas o relacionado.
        user = self.request.user
        if IsSecretaria().has_permission(self.request, self) or IsProfessor().has_permission(self.request, self):
            return Advertencia.objects.all()
        elif IsResponsavel().has_permission(self.request, self):
            return Advertencia.objects.filter(aluno__Responsavel__user=user)
        elif IsAluno().has_permission(self.request, self):
            return Advertencia.objects.filter(aluno__user=user)
        return Advertencia.objects.none()
        
    def get_permissions(self):
        # 🟢 CORREÇÃO: APENAS SECRETARIA PODE CRIAR/EDITAR/DELETAR
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsSecretaria] # <-- Removido IsProfessor
        else:
            # Leitura permitida para todos autenticados (filtrada por get_queryset)
            self.permission_classes = [IsAuthenticated] 
        return super().get_permissions()

class SuspensaoViewSet(viewsets.ModelViewSet):
    queryset = Suspensao.objects.all()
    serializer_class = SuspensaoSerializer

    def get_queryset(self):
        # Lógica de filtro para leitura: (Quem pode ver?)
        # Secretaria/Professor veem tudo; Aluno/Responsável veem apenas o relacionado.
        user = self.request.user
        if IsSecretaria().has_permission(self.request, self) or IsProfessor().has_permission(self.request, self):
            return Suspensao.objects.all()
        elif IsResponsavel().has_permission(self.request, self):
            return Suspensao.objects.filter(aluno__Responsavel__user=user)
        elif IsAluno().has_permission(self.request, self):
            return Suspensao.objects.filter(aluno__user=user)
        return Suspensao.objects.none()
        
    def get_permissions(self):
        # 🟢 CORREÇÃO: APENAS SECRETARIA PODE CRIAR/EDITAR/DELETAR
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsSecretaria] # <-- Removido IsProfessor
        else:
            # Leitura permitida para todos autenticados (filtrada por get_queryset)
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

class EventoExtracurricularViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EventoExtracurricular.objects.all()
    serializer_class = EventoExtracurricularSerializer
    permission_classes = [IsAuthenticated]

# -----------------------------------------------------------------
# ARQUIVO MODIFICADO AQUI (Isso corrige o Erro 405 Method Not Allowed)
# -----------------------------------------------------------------
class EventoCalendarioViewSet(viewsets.ModelViewSet): # <--- 1. MUDANÇA AQUI (de ReadOnlyModelViewSet)
    queryset = EventoCalendario.objects.all()
    serializer_class = EventoCalendarioSerializer
    
    # 2. LÓGICA DE PERMISSÃO ADICIONADA AQUI
    def get_permissions(self):
        """
        Define permissões diferentes para ações diferentes.
        - Secretaria pode fazer TUDO (CRUD).
        - Outros usuários logados podem apenas LER (GET).
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Ações de escrita (POST, PUT, PATCH, DELETE)
            # Apenas a Secretaria pode modificar o calendário
            self.permission_classes = [IsSecretaria]
        else:
            # Ações de leitura (GET - list, retrieve)
            # Qualquer usuário logado pode ver o calendário
            self.permission_classes = [IsAuthenticated]
            
        return super().get_permissions()
# -----------------------------------------------------------------
# FIM DA MODIFICAÇÃO
# -----------------------------------------------------------------

class LivroViewSet(viewsets.ModelViewSet):
    queryset = Livro.objects.all()
    serializer_class = LivroSerializer
    
    def get_permissions(self):
        # 🟢 CORREÇÃO: Gerenciamento de estoque (CRUD) APENAS para Auxiliar Admin
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAuxiliarAdmin] # <-- AGORA É EXCLUSIVO
        else:
            # Qualquer pessoa logada pode listar o acervo (ler)
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

class EmprestimoLivroViewSet(viewsets.ModelViewSet):
    queryset = EmprestimoLivro.objects.all()
    serializer_class = EmprestimoLivroSerializer
    
    def get_permissions(self):
        # 🟢 CORREÇÃO: Registrar/Finalizar Empréstimo (CRUD) APENAS para Auxiliar Admin
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAuxiliarAdmin] # <-- AGORA É EXCLUSIVO
        else:
            # Qualquer pessoa logada pode ler seus próprios empréstimos, ou todos (a depender de get_queryset)
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

class BimestreViewSet(viewsets.ModelViewSet):
    queryset = Bimestre.objects.all()
    serializer_class = BimestreSerializer
    permission_classes = [IsSecretaria]

class SalaViewSet(viewsets.ModelViewSet):
    queryset = Sala.objects.all()
    serializer_class = SalaSerializer
    
    def get_permissions(self):
        # Apenas a Secretaria pode criar/editar salas (CRUD completo)
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsSecretaria]
        else:
            # Todos logados podem ver as salas disponíveis
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

class ReservaViewSet(viewsets.ModelViewSet):
    queryset = Reserva.objects.all()
    serializer_class = ReservaSerializer
    
    # 🟢 CORREÇÃO 1: FILTRO DE RESERVAS (Professor Vê Apenas As Suas)
    def get_queryset(self):
        user = self.request.user
        
        if user.is_anonymous:
            return Reserva.objects.none()

        if IsSecretaria().has_permission(self.request, self):
            return Reserva.objects.all()
        
        if IsProfessor().has_permission(self.request, self):
            professor = get_professor_by_user(user)
            if professor:
                # Retorna reservas filtradas pelo OBJETO Professor
                return Reserva.objects.filter(professor=professor) 
            
        return Reserva.objects.none()

    # 🟢 CORREÇÃO 2: INJETAR PROFESSOR (Associação Automática)
    def perform_create(self, serializer):
        user = self.request.user
        professor = get_professor_by_user(user)
        
        if not professor:
            raise PermissionDenied("Apenas Professores podem criar reservas.")
            
        # Salva o serializer, injetando o objeto Professor no campo de FK
        serializer.save(professor=professor) 
        
    def get_permissions(self):
        # Permissão de Professor/Secretaria para criar/destruir
        if self.action in ['create', 'destroy']:
            self.permission_classes = [IsProfessor | IsSecretaria]
        # UPDATE só para Secretaria (para evitar que professor edite o horário de outro)
        elif self.action in ['update', 'partial_update']:
            self.permission_classes = [IsSecretaria] 
        else: 
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    

class UserRegistrationBySecretariaView(APIView):
    permission_classes = [IsSecretaria] # Apenas a secretaria pode acessar

    @transaction.atomic # Garante que todas as operações no banco sejam feitas com sucesso, ou nenhuma é feita.
    def post(self, request):
        # ... (código existente que está funcionando) ...
        full_name = request.data.get('full_name')
        cpf = request.data.get('cpf')
        email = request.data.get('email')
        phone_number = request.data.get('phone_number')
        cargo = request.data.get('cargo') # 'aluno', 'responsavel', 'professor'
        birthday = request.data.get('birthday')
        password = request.data.get('password')

        required_fields = [full_name, cpf, email, phone_number, cargo, birthday, password]
        if not all(required_fields):
            return Response({'error': 'Todos os campos são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'Este e-mail já está em uso.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.create_user(username=cpf, email=email, password=password)
            user.first_name = full_name.split(' ')[0]
            user.last_name = ' '.join(full_name.split(' ')[1:])
            user.save()
        except Exception as e:
            return Response({'error': f'Erro ao criar usuário: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            if cargo.lower() == 'aluno':
                group = Group.objects.get(name='Aluno')
                Aluno.objects.create(
                    user=user, name_aluno=full_name, cpf_aluno=cpf, email_aluno=email, 
                    phone_number_aluno=phone_number, birthday_aluno=birthday
                    # Atenção: Faltarão outros campos obrigatórios de Aluno
                )
            elif cargo.lower() == 'responsavel':
                group = Group.objects.get(name='Responsavel')
                Responsavel.objects.create(
                    user=user, name=full_name, cpf=cpf, email=email, 
                    phone_number=phone_number, birthday=birthday
                )
            elif cargo.lower() == 'professor':
                group = Group.objects.get(name='Professor')
                Professor.objects.create(
                    user=user, name_professor=full_name, cpf_professor=cpf, email_professor=email,
                    phone_number_professor=phone_number, birthday_professor=birthday
                )
            else:
                user.delete() 
                return Response({'error': 'Cargo inválido.'}, status=status.HTTP_400_BAD_REQUEST)

            user.groups.add(group)
        except Group.DoesNotExist:
             return Response({'error': f'O grupo {cargo} não foi encontrado. Crie-o no painel admin.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({'error': f'Erro ao criar perfil: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'success': f'Usuário {full_name} ({cargo}) criado com sucesso!'}, status=status.HTTP_201_CREATED)
    
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# --- VIEWS DE RESET DE SENHA (USANDO O NOVO MÉTODO DE TOKEN) ---
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'success': 'Se um usuário com este e-mail existir, um link de redefinição foi enviado.'}, status=status.HTTP_200_OK)

        PasswordResetToken.objects.filter(user=user).delete()
        
        token_obj = PasswordResetToken.objects.create(user=user)
        
        reset_link = f"http://localhost:5173/resetar-senha/{token_obj.token}"
        
        subject = 'Seu link de redefinição de senha'
        message = f'Olá, {user.first_name}.\n\nClique no link a seguir para redefinir sua senha:\n{reset_link}\n\nEste link expira em 1 hora.'
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])

        return Response({'success': 'Se um usuário com este e-mail existir, um link de redefinição foi enviado.'}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token_from_request = request.data.get('token')
        new_password = request.data.get('password')

        try:
            token_obj = PasswordResetToken.objects.get(token=token_from_request)

            if token_obj.created_at < timezone.now() - timedelta(hours=1):
                token_obj.delete()
                return Response({'error': 'O token de redefinição expirou.'}, status=status.HTTP_400_BAD_REQUEST)

            user = token_obj.user
            user.set_password(new_password)
            user.save()

            token_obj.delete()
            
            return Response({'success': 'Senha redefinida com sucesso!'}, status=status.HTTP_200_OK)
        
        except (PasswordResetToken.DoesNotExist, ValueError):
             return Response({'error': 'Token inválido.'}, status=status.HTTP_400_BAD_REQUEST)