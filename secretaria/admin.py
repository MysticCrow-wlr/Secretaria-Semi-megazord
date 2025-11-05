# secretaria/admin.py

from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Responsavel, Aluno, Professor, Bimestre, Nota, AtividadePendente,
    # --- CORREÇÃO: Removidos imports duplicados ---
    EventoExtracurricular, PlanejamentoSemanal, Advertencia, Suspensao,
    EventoCalendario, EmprestimoLivro, Livro, Sala, Reserva 
)
from django.contrib.auth.models import Group, User
from django.apps import apps
import string
import random

# O admin.py define como os dados serão exibidos no painel de administração do Django.

# --- CORREÇÃO: Definindo um Inline para Aluno ---
# Isso permite que você veja e edite Alunos DENTRO da página de um Responsável.
class AlunoInline(admin.TabularInline): # Ou admin.StackedInline para um layout diferente
    model = Aluno
    # Lista os campos do Aluno que você quer mostrar no inline
    fields = ('name_aluno', 'class_choice', 'cpf_aluno', 'birthday_aluno', 'faltas_aluno')
    # Não mostra formulários em branco por padrão
    extra = 0
    # Adiciona um link para a página de edição completa do Aluno
    show_change_link = True

    # Impede a *criação* de Alunos a partir daqui,
    # pois a lógica de criação de User está no AlunosAdmin (save_model).
    # Isso força o admin a criar o Aluno pela página de Alunos, garantindo que o User seja criado.
    def has_add_permission(self, request, obj=None):
        return False
        
    # Opcional: Impede a exclusão por aqui também
    # def has_delete_permission(self, request, obj=None):
    #     return False

@admin.register(Responsavel)
class ResponsaveisAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_name', 'get_phone_number', 'get_email', 'get_adress', 'get_cpf', 'get_birthday')
    list_display_links = ('get_name',)
    search_fields = ('name', 'cpf',)
    list_filter = ('name', 'cpf',)

    # --- CORREÇÃO: fieldsets alterado ---
    # Agora lista APENAS os campos que existem no modelo 'Responsavel'.
    # Os campos do Aluno ('name_aluno', 'faltas_aluno', etc.) foram removidos daqui.
    fieldsets = (
        ('Informações Pessoais', {
            'fields': ('name', 'cpf', 'birthday',),
        }),
        ('Informações de Contato', {
            'fields': ('email', 'phone_number', 'adress',),
        }),
        # O campo 'user' é tratado pelo 'save_model' e 'exclude'
    )
    
    # --- CORREÇÃO: Adicionado o Inline ---
    # Isso fará com que uma tabela de Alunos apareça na página do Responsável
    inlines = [AlunoInline]
    
    # --- NOVO: Esconde o campo 'user' do formulário ---
    exclude = ('user',)

    # --- NOVO: Lógica para criar o User automaticamente ---
    def save_model(self, request, obj, form, change):
        if not change: # Roda apenas na criação
            password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
            try:
                user = User.objects.create_user(
                    username=obj.cpf,
                    email=obj.email,
                    password=password,
                    first_name=obj.name.split(' ')[0],
                    last_name=' '.join(obj.name.split(' ')[1:])
                )
                responsavel_group = Group.objects.get(name='Responsavel')
                user.groups.add(responsavel_group)
                obj.user = user
                print(f"Usuário {user.username} (Responsável) criado com a senha temporária: {password}")
            except Exception as e:
                print(f"ERRO ao criar usuário para o responsável {obj.name}: {e}")
                # Aqui você pode adicionar uma mensagem de erro para o admin
                from django.contrib import messages
                messages.set_level(request, messages.ERROR)
                messages.error(request, f"Não foi possível criar o usuário de login. O e-mail ou CPF já podem existir. Erro: {e}")
                return
        super().save_model(request, obj, form, change)

    def get_name(self, obj):
        return obj.name
    get_name.short_description = 'Nome do Responsável'

    def get_phone_number(self, obj):
        return obj.phone_number
    get_phone_number.short_description = 'Celular'

    def get_email(self, obj):
        return obj.email
    get_email.short_description = 'E-mail'

    def get_adress(self, obj):
        return obj.adress
    get_adress.short_description = 'Endereço'

    def get_cpf(self, obj):
        return obj.cpf
    get_cpf.short_description = 'CPF'

    def get_birthday(self, obj):
        return obj.birthday
    get_birthday.short_description = 'Data de Nascimento'

@admin.register(Aluno)
class AlunosAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_turma', 'get_nome', 'get_celular', 'get_email', 'get_cpf', 'birthday_aluno', 'faltas_aluno')
    list_display_links = ('get_nome',)
    search_fields = ('name_aluno', 'cpf_aluno',)
    list_filter = ('class_choice',)

    # --- CORREÇÃO: O fieldsets do Aluno está correto ---
    # Ele DEVE conter os campos do Aluno e a ForeignKey 'Responsavel'
    fieldsets = (
        (None, {
            'fields': ('Responsavel', 'name_aluno', 'cpf_aluno', 'birthday_aluno', 'email_aluno', 'phone_number_aluno',),
        }),
        ('Informações Escolares', {
            'fields': ('class_choice', 'month_choice', 'ano_letivo', 
                       'faltas_aluno', 'presencas_aluno'), 
        }),
        ('Avaliação Descritiva', {
            'fields': ('comentario_descritivo',),
            'description': 'Texto descritivo sobre a performance e comportamento do aluno.',
        }),
    )

    # --- NOVO: Esconde o campo 'user' do formulário ---
    exclude = ('user',)

    # --- NOVO: Lógica para criar o User automaticamente ---
    def save_model(self, request, obj, form, change):
        if not change: # Roda apenas na criação
            password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
            try:
                user = User.objects.create_user(
                    username=obj.cpf_aluno,
                    email=obj.email_aluno,
                    password=password,
                    first_name=obj.name_aluno.split(' ')[0],
                    last_name=' '.join(obj.name_aluno.split(' ')[1:])
                )
                aluno_group = Group.objects.get(name='Aluno')
                user.groups.add(aluno_group)
                obj.user = user
                print(f"Usuário {user.username} (Aluno) criado com a senha temporária: {password}")
            except Exception as e:
                print(f"ERRO ao criar usuário para o aluno {obj.name_aluno}: {e}")
                from django.contrib import messages
                messages.set_level(request, messages.ERROR)
                messages.error(request, f"Não foi possível criar o usuário de login. O e-mail ou CPF já podem existir. Erro: {e}")
                return
        super().save_model(request, obj, form, change)

    def get_turma(self, obj):
        return obj.class_choice
    get_turma.short_description = 'Turma'

    def get_nome(self, obj):
        return obj.name_aluno
    get_nome.short_description = 'Nome do Aluno'

    def get_celular(self, obj):
        return obj.phone_number_aluno
    get_celular.short_description = 'Número de Celular'

    def get_email(self, obj):
        return obj.email_aluno
    get_email.short_description = 'E-mail do Aluno'

    def get_cpf(self, obj):
        return obj.cpf_aluno
    get_cpf.short_description = 'CPF do Aluno'

# --- O RESTANTE DO SEU CÓDIGO ESTÁ MANTIDO ---

@admin.register(Professor)
class ProfessorAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_name', 'get_phone', 'get_email','get_cpf', 'get_birthday', 'get_matricula')
    list_display_links = ('get_name',)
    search_fields = ('name_professor', 'cpf_professor',)
    list_filter = ('name_professor', 'cpf_professor',)

    # --- NOVO: Esconde o campo 'user' do formulário ---
    exclude = ('user',)

    # --- NOVO: Lógica para criar o User automaticamente ---
    def save_model(self, request, obj, form, change):
        if not change: # Roda apenas na criação
            password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
            try:
                user = User.objects.create_user(
                    username=obj.cpf_professor,
                    email=obj.email_professor,
                    password=password,
                    first_name=obj.name_professor.split(' ')[0],
                    last_name=' '.join(obj.name_professor.split(' ')[1:])
                )
                professor_group = Group.objects.get(name='Professor')
                user.groups.add(professor_group)
                obj.user = user
                print(f"Usuário {user.username} (Professor) criado com a senha temporária: {password}")
            except Exception as e:
                print(f"ERRO ao criar usuário para o professor {obj.name_professor}: {e}")
                from django.contrib import messages
                messages.set_level(request, messages.ERROR)
                messages.error(request, f"Não foi possível criar o usuário de login. O e-mail ou CPF já podem existir. Erro: {e}")
                return
        super().save_model(request, obj, form, change)

    def get_name(self, obj):
        return obj.name_professor
    get_name.short_description = 'Nome do Professor'

    def get_phone(self, obj):
        return obj.phone_number_professor
    get_phone.short_description = 'Celular'

    def get_email(self, obj):
        return obj.email_professor
    get_email.short_description = 'E-mail'

    def get_cpf(self, obj):
        return obj.cpf_professor
    get_cpf.short_description = 'CPF'

    def get_birthday(self, obj):
        return obj.birthday_professor
    get_birthday.short_description = 'Nascimento'

    def get_matricula(self, obj):
        return obj.matricula_professor
    get_matricula.short_description = 'Matrícula'

# Os registros abaixo permanecem como estavam
@admin.register(Bimestre)
class BimestreAdmin(admin.ModelAdmin):
    list_display = ('id', 'numero')
    list_filter = ('numero',)

@admin.register(EmprestimoLivro)
class EmprestimoMaterialAdmin(admin.ModelAdmin):
    list_display = ('id', 'tipo', 'livro', 'computador', 'aluno', 'data_emprestimo', 'devolvido', 'data_devolucao')
    list_filter = ('tipo', 'devolvido', 'data_emprestimo', 'livro', 'aluno')
    search_fields = ('livro__titulo', 'computador', 'aluno__name_aluno')

@admin.register(Livro)
class LivroAdmin(admin.ModelAdmin):
    list_display = ('id', 'titulo', 'autor', 'data_publicacao')
    search_fields = ('titulo', 'autor')
    list_filter = ('data_publicacao', 'autor')

@admin.register(Nota)
class NotaAdmin(admin.ModelAdmin):
    list_display = ('id', 'aluno', 'disciplina', 'bimestre', 'valor')
    list_filter = ('bimestre', 'aluno__class_choice', 'aluno', 'disciplina')
    ordering = ('bimestre', 'aluno__class_choice', 'aluno', 'disciplina')

@admin.register(AtividadePendente)
class AtividadePendenteAdmin(admin.ModelAdmin):
    # 1. list_display: Exibe os novos campos
    list_display = ('id', 'aluno', 'titulo', 'status', 'data_limite', 'data_criacao') 
    
    # 2. list_filter: Filtra pelos novos campos e pela turma do aluno
    # Note: 'aluno__class_choice' é um filtro válido por ForeignKey (Aluno)
    list_filter = ('status', 'aluno__class_choice', 'data_limite') 
    
    # 3. ordering: Ordena pelos novos campos (Status e Prazo são lógicos para Tarefas)
    ordering = ('status', 'data_limite', 'aluno') 
    
    # Opcional, mas útil: permite que o usuário pesquise por aluno, título e descrição
    search_fields = ('aluno__name_aluno', 'titulo', 'descricao')
    
    # Garante que campos como 'data_criacao' não possam ser alterados
    readonly_fields = ('data_criacao',)

@admin.register(EventoExtracurricular)
class EventoExtracurricularAdmin(admin.ModelAdmin):
    list_display = ('id', 'titulo', 'data', 'professor_id')
    search_fields = ('titulo', 'professor_id')
    list_filter = ('data',)

@admin.register(PlanejamentoSemanal)
class PlanejamentoSemanalAdmin(admin.ModelAdmin):
    list_display = ('turma', 'disciplina', 'professor', 'data_aula', 'dia_semana', 'turno', 'horario_inicio', 'horario_fim')
    list_filter = ('turma', 'disciplina', 'professor', 'data_aula', 'dia_semana', 'turno')
    search_fields = ('disciplina', 'professor__name_professor', 'turma')
    date_hierarchy = 'data_aula'
    ordering = ('-data_aula', 'horario_inicio')
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': (
                'professor', 
                'turma', 
                'disciplina',
                'data_aula',
                'dia_semana',
                'turno'
            )
        }),
        ('Horários', {
            'fields': (
                'horario_inicio',
                'horario_fim'
            )
        }),
        ('Conteúdo do Planejamento', {
            'fields': (
                'conteudo',
                'atividades', 
                'recursos',
                'observacoes'
            )
        }),
        ('Metadados', {
            'fields': (
                'criado_em',
                'atualizado_em'
            ),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ('criado_em', 'atualizado_em')
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing an existing object
            return self.readonly_fields + ('professor', 'turma', 'data_aula')
        return self.readonly_fields

@admin.register(Advertencia)
class AdvertenciaAdmin(admin.ModelAdmin):
    list_display = ('id', 'aluno', 'data', 'motivo')
    search_fields = ('aluno__cpf_aluno', 'aluno__name_aluno', 'motivo')
    list_filter = ('data', 'motivo',)
    autocomplete_fields = ['aluno']

@admin.register(Suspensao)
class SuspensaoAdmin(admin.ModelAdmin):
    list_display = ('id', 'aluno', 'data_inicio', 'data_fim', 'motivo')
    search_fields = ('aluno__cpf_aluno', 'aluno__name_aluno', 'motivo')
    list_filter = ('data_inicio', 'data_fim', 'motivo',)
    autocomplete_fields = ['aluno']

@admin.register(EventoCalendario)
class EventoCalendarioAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'tipo', 'data')
    list_filter = ('tipo', 'data')
    search_fields = ('titulo', 'descricao')

@admin.register(Sala)
class SalaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'tipo', 'capacidade', 'recursos')
    list_filter = ('tipo', 'capacidade')
    search_fields = ('nome', 'recursos')
    # Permite ver o rótulo completo no Admin
    def tipo(self, obj):
        return obj.get_tipo_display() 
    tipo.short_description = 'Tipo de Sala'


@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    list_display = ('id', 'sala', 'professor', 'data', 'horario_inicio', 'horario_fim', 'finalidade')
    list_filter = ('data', 'sala__nome', 'professor__name_professor')
    search_fields = ('sala__nome', 'professor__name_professor', 'finalidade')
    date_hierarchy = 'data'

# Personalizações do site admin
apps.get_app_config('auth').verbose_name = 'Controle de Usuários'
admin.site.site_header = "Secretaria Master"
admin.site.site_title = "Painel Administrativo"
admin.site.index_title = "Administração do Sistema"
Group._meta.verbose_name = "Grupo"
Group._meta.verbose_name_plural = "Grupos"
User._meta.verbose_name = "Usuário"
User._meta.verbose_name_plural = "Usuários"