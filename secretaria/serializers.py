# secretaria/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from django.db.models import Q
# --- CORREÇÃO IMPORTANTE APLICADA AQUI ---
from django.contrib.auth import authenticate # Importamos a função que faltava
# ----------------------------------------
from .models import (
    Responsavel, Aluno, Professor, Bimestre, Nota, 
    AtividadePendente, EventoExtracurricular, 
    AtividadePendente, EventoExtracurricular, PlanejamentoSemanal, 
    Advertencia, Suspensao, EventoCalendario, EmprestimoLivro, Livro, 
    Sala, Reserva
)

# === CLASSE DE AUTENTICAÇÃO ATUALIZADA (VERSÃO MAIS ROBUSTA) ===
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'cpf'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Adiciona o username (CPF)
        token['username'] = user.username
        
        # --- MUDANÇA APLICADA AQUI ---
        # Buscamos o primeiro "Grupo" (cargo) do usuário e o adicionamos ao token.
        cargo = None
        if user.groups.exists():
            cargo = user.groups.first().name  # Pega o nome (ex: "Secretaria", "Professor")
        
        token['cargo'] = cargo # Adiciona a chave 'cargo' ao token
        # --- FIM DA MUDANÇA ---

        return token

    def validate(self, attrs):
        # Pega o CPF que o frontend enviou no campo 'cpf'
        cpf = attrs.get('cpf')
        password = attrs.get('password')

        if not cpf or not password:
            raise serializers.ValidationError('CPF e senha são obrigatórios.', code='authorization')

        # Usa a função authenticate do Django, passando o CPF como 'username'.
        user = authenticate(request=self.context.get('request'), username=cpf, password=password)

        if not user:
            raise serializers.ValidationError('CPF ou senha inválidos.', code='authorization')

        # Se a autenticação foi bem-sucedida, o resto do código gera os tokens.
        refresh = self.get_token(user)

        data = {}
        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)

        return data


# --- RESTANTE DOS SEUS SERIALIZERS (SEM ALTERAÇÕES) ---
class ResponsavelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Responsavel
        fields = '__all__'

class ProfessorSerializer(serializers.ModelSerializer):
    disciplina_label = serializers.CharField(source='get_disciplina_display', read_only=True)
    
    class Meta:
        model = Professor
        fields = '__all__'

# -----------------------------------------------------------------
# --- AJUSTES APLICADOS NESTA CLASSE (AlunoSerializer) ---
# -----------------------------------------------------------------
class AlunoSerializer(serializers.ModelSerializer):
    responsavel_nome = serializers.StringRelatedField(source='Responsavel', read_only=True)
    
    # --- AJUSTE 1 ---
    # Este campo agora é de LEITURA e ESCRITA.
    # Ele vai *enviar* o ID do Responsável no GET (leitura)
    # e *receber* o ID do Responsável no PATCH (escrita).
    # O nome 'Responsavel' (maiúsculo) bate com o campo do Model.
    Responsavel = serializers.PrimaryKeyRelatedField(queryset=Responsavel.objects.all())
    
    # --- AJUSTE 2 ---
    # Removemos a linha duplicada que havia abaixo
    faltas_aluno = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Aluno
        fields = [
            'id', 'user', 'name_aluno', 'phone_number_aluno', 'email_aluno', 'cpf_aluno', 
            'birthday_aluno', 'class_choice', 'month_choice', 'faltas_aluno', 
            'ano_letivo', 
            'Responsavel', # <-- AJUSTE 3: Usamos o nome correto do campo (maiúsculo)
            'responsavel_nome', 
            'comentario_descritivo',
            'presencas_aluno',
            'ativo' # <-- AJUSTE 4: Adicionamos o campo 'ativo' que faltava para o DashboardOne
        ]
# -----------------------------------------------------------------
# --- FIM DOS AJUSTES ---
# -----------------------------------------------------------------

class BimestreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bimestre
        fields = '__all__'

class NotaSerializer(serializers.ModelSerializer):
    aluno_nome = serializers.StringRelatedField(source='aluno', read_only=True)
    bimestre_numero = serializers.StringRelatedField(source='bimestre', read_only=True)
    
    aluno = serializers.PrimaryKeyRelatedField(queryset=Aluno.objects.all(), write_only=True)
    
    # 💥 CORREÇÃO CRÍTICA: REMOVE write_only=True para expor o ID na leitura (GET)
    bimestre = serializers.PrimaryKeyRelatedField(queryset=Bimestre.objects.all()) 
    
    class Meta:
        model = Nota
        fields = [
            'id', 'aluno', 'aluno_nome', 'bimestre', 'bimestre_numero', 'valor', 'disciplina'
        ]

class AtividadePendenteSerializer(serializers.ModelSerializer):
    aluno_nome = serializers.StringRelatedField(source='aluno', read_only=True)
    
    aluno = serializers.PrimaryKeyRelatedField(queryset=Aluno.objects.all(), write_only=True)
    
    class Meta:
        model = AtividadePendente
        fields = [
            'id', 'aluno', 'aluno_nome', 
            'titulo', 'descricao', 'data_limite', 'status', 'data_criacao'
        ]
        extra_kwargs = {
            'data_criacao': {'read_only': True},
        }

class PlanejamentoSemanalSerializer(serializers.ModelSerializer):
    professor_nome = serializers.CharField(source='professor.name_professor', read_only=True)
    
    class Meta:
        model = PlanejamentoSemanal
        fields = '__all__'

class AdvertenciaSerializer(serializers.ModelSerializer):
    aluno_nome = serializers.StringRelatedField(source='aluno', read_only=True)
    aluno = serializers.PrimaryKeyRelatedField(queryset=Aluno.objects.all(), write_only=True)
    class Meta:
        model = Advertencia
        fields = ['id', 'aluno', 'aluno_nome', 'data', 'motivo', 'observacao']

class SuspensaoSerializer(serializers.ModelSerializer):
    aluno_nome = serializers.StringRelatedField(source='aluno', read_only=True)
    aluno = serializers.PrimaryKeyRelatedField(queryset=Aluno.objects.all(), write_only=True)
    class Meta:
        model = Suspensao
        fields = ['id', 'aluno', 'aluno_nome', 'data_inicio', 'data_fim', 'motivo', 'observacao']

class EventoExtracurricularSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventoExtracurricular
        fields = '__all__'

class EventoCalendarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventoCalendario
        fields = '__all__'

class LivroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Livro
        # ✅ 'fields = "__all__"' AGORA INCLUIRÁ OS NOVOS CAMPOS
        fields = '__all__'

class EmprestimoLivroSerializer(serializers.ModelSerializer):
    # Campos de leitura que o Frontend precisa para a tabela
    aluno_nome = serializers.StringRelatedField(source='aluno', read_only=True)
    livro_titulo = serializers.StringRelatedField(source='livro', read_only=True)
    
    # Campos de escrita (PK)
    aluno = serializers.PrimaryKeyRelatedField(
        queryset=Aluno.objects.all(), 
        write_only=True
    )
    livro = serializers.PrimaryKeyRelatedField(
        queryset=Livro.objects.all(), 
        write_only=True,
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = EmprestimoLivro
        fields = [
            'id', 'aluno', 'aluno_nome', 'livro', 'livro_titulo', 
            'tipo', 'computador', 'data_emprestimo', 'data_devolucao', 'devolvido'
        ]
    
class SalaSerializer(serializers.ModelSerializer):
    # 🟢 CORREÇÃO: Adiciona o rótulo de exibição para UX
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = Sala
        # Incluir o novo campo na resposta da API
        fields = ['id', 'nome', 'tipo', 'tipo_display', 'capacidade', 'recursos']

class ReservaSerializer(serializers.ModelSerializer):
    sala_nome = serializers.StringRelatedField(source='sala', read_only=True)
    professor_nome = serializers.StringRelatedField(source='professor', read_only=True)
    
    class Meta:
        model = Reserva
        fields = '__all__'
        # ✅ Manter a validação de unicidade básica
        # unique_together = (('sala', 'data', 'horario_inicio'),) # Isso deve estar no Model Meta

    def validate(self, data):
        """
        Verifica se a nova reserva entra em conflito com reservas existentes
        na mesma sala e data.
        """
        # Obter os dados da nova reserva
        sala = data.get('sala')
        data_reserva = data.get('data')
        inicio = data.get('horario_inicio')
        fim = data.get('horario_fim')
        
        # Se for uma atualização (PUT/PATCH), excluímos a reserva atual da checagem
        instance = self.instance
        
        # 🚨 VALIDAÇÃO BÁSICA: Início deve ser antes do Fim
        if inicio >= fim:
            raise serializers.ValidationError({"horario_fim": "O horário de término deve ser posterior ao horário de início."})
        
        # 🔍 LÓGICA DE CONFLITO DE SOBREPOSIÇÃO
        # Buscamos por reservas existentes para a mesma sala e data
        # onde: (Início_Existente < Fim_Nova) E (Fim_Existente > Início_Nova)
        
        reservas_conflitantes = Reserva.objects.filter(
            sala=sala,
            data=data_reserva
        ).filter(
            Q(horario_inicio__lt=fim) & Q(horario_fim__gt=inicio)
        )
        
        # Excluir a instância atual se for uma atualização
        if instance:
            reservas_conflitantes = reservas_conflitantes.exclude(pk=instance.pk)
        
        if reservas_conflitantes.exists():
            conflito = reservas_conflitantes.first()
            raise serializers.ValidationError(
                f"Conflito de horário: A sala {sala.nome} já está reservada das {conflito.horario_inicio.strftime('%H:%M')} às {conflito.horario_fim.strftime('%H:%M')}."
            )

        return data