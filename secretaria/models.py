#secretaria/models.py
from django.db import models
import datetime
from .validators import validar_cpf, validar_telefone
from django.contrib.auth.models import User
import uuid
from django.conf import settings

# O models.py define as estruturas de dados de todas as ferramentas implementadas, utilizando os modelos do Django. Cada classe representa uma ferramenta/implementação diferente.
# Inclui uma "classe Meta" em todos os models, principalmente para corrigir o nome que aparece no painel de administração do Django e também para uma melhor organização.


#Representa o responsável legal de um aluno.
class Responsavel(models.Model):

    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=50, verbose_name="Digite o nome do responsavel")
    phone_number = models.CharField(max_length=11, verbose_name="Digite o numero do celular(xx)xxxxx-xxxx", validators=[validar_telefone])
    email = models.EmailField(max_length=100, verbose_name="Digite o email do responsavel")
    adress = models.CharField(max_length=100, verbose_name="Digite o endereço do responsavel") 
    cpf = models.CharField(max_length=11, unique=True, verbose_name="Digite o cpf do responsavel", validators=[validar_cpf])
    birthday = models.DateField(verbose_name="Data de nascimento")

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "Responsável" # Nome no singular
        verbose_name_plural = "Responsáveis" # Nome no plural


class Nota(models.Model):

    DISCIPLINA_CHOICES = (
    ('LING',"Linguagens"),
    ('CH',"Ciências Humanas"),
    ('CN',"Ciências da Natureza"),
    ('MAT',"Matemática"),
    ('DS',"Itinerário técnico"),
    )

    aluno = models.ForeignKey('Aluno', on_delete=models.CASCADE)
    bimestre = models.ForeignKey('Bimestre', on_delete=models.CASCADE)
    valor = models.FloatField()
    disciplina = models.CharField(max_length=4, choices= DISCIPLINA_CHOICES)

    def __str__(self):
        return f"{self.aluno} - {self.disciplina} - Bimestre {self.bimestre.numero}: {self.valor}"
    
    class Meta:
        verbose_name = "Nota"
        verbose_name_plural = "Notas"


# Representa os professores da escola.   
class Professor(models.Model):
    
    disciplina = models.CharField(max_length=4, choices=Nota.DISCIPLINA_CHOICES,verbose_name="Disciplina Principal")
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    name_professor = models.CharField(max_length=50, verbose_name="Digite o nome do professor", blank=False)
    phone_number_professor = models.CharField(max_length=11, verbose_name="Digite o numero do celular(xx)xxxxx-xxxx", validators=[validar_telefone])
    email_professor = models.EmailField(max_length=100, verbose_name="Digite o email do professor")
    cpf_professor = models.CharField(max_length=11, unique=True, verbose_name="Digite o cpf do professor")
    birthday_professor = models.DateField(verbose_name="Data de nascimento")
    matricula_professor = models.CharField(max_length=11,unique=True,verbose_name="Digite sua matricula: ")

    def __str__(self):
        return self.name_professor
    
    class Meta:
        verbose_name = "Professor"
        verbose_name_plural = "Professores"


# Representa o aluno da escola
class Aluno(models.Model):

    TURMA_CHOICES = (
    ("1A", "1 ANO A"),
    ("1B", "1 ANO B"),
    ("1C", "1 ANO C"),
    ("2A", "2 ANO A"),
    ("2B", "2 ANO B"),
    ("2C", "2 ANO C"),
    ("3A", "3 ANO A"),
    ("3B", "3 ANO B"),
    ("3C", "3 ANO C"),
    )
    MONTH_CHOICES = (
    ("01", "Janeiro"),
    ("02", "Fevereiro"),
    ("03", "Março"),
    ("04", "Abril"),
    ("05", "Maio"),
    ("06", "Junho"),
    ("07", "Julho"),
    ("08", "Agosto"),
    ("09", "Setembro"),
    ("10", "Outubro"),
    ("11", "Novembro"),
    ("12", "Dezembro"),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    name_aluno = models.CharField(max_length=50, verbose_name="Digite o nome do Aluno")
    phone_number_aluno = models.CharField(max_length=11, verbose_name="Digite o numero do celular(xx)xxxxx-xxxx", validators=[validar_telefone])
    email_aluno = models.EmailField(max_length=100, verbose_name="Digite o email do aluno")
    cpf_aluno = models.CharField(max_length=11, unique=True, verbose_name="Digite o cpf do aluno")
    birthday_aluno = models.DateField(verbose_name="Data de nascimento")
    ativo = models.BooleanField(default=True)

    # Escolhi usar choices em campos como turmaa e disciplina criar uma padronização.

    class_choice = models.CharField(max_length=2, choices=TURMA_CHOICES,verbose_name="Turma", blank=True, null=False)
    month_choice = models.CharField(max_length=2, choices=MONTH_CHOICES,verbose_name="Mês da matrícula", blank=True, null=False)
    faltas_aluno = models.PositiveIntegerField(default=0, verbose_name="Número de Faltas")
    presencas_aluno = models.PositiveIntegerField(default=0, verbose_name="Número de Presenças")
    ano_letivo = models.PositiveIntegerField(default=datetime.datetime.now().year, verbose_name="Ano Letivo")

    # Usei ForeignKey para relacionar alunos com responsáveis e notas

    Responsavel = models.ForeignKey(Responsavel, on_delete=models.CASCADE, null=False)

    comentario_descritivo = models.TextField(
        blank=True,
        null=True,
        verbose_name="Comentário Descritivo do Aluno/Performance"
    )

    def __str__(self):
        return f"{self.class_choice} - {self.name_aluno} ({self.cpf_aluno})"
    
    # Calcula a média das notas do aluno

    def media_por_disciplina(self, disciplina):
        notas = self.nota_set.filter(disciplina=disciplina)
        if notas.exists():
            return sum(n.valor for n in notas) / notas.count() 

    class Meta:
        verbose_name = "Aluno"
        verbose_name_plural = "Alunos"

class Bimestre(models.Model):
    BIMESTRE_CHOICES = [
        (1, '1º Bimestre'),
        (2, '2º Bimestre'),
        (3, '3º Bimestre'),
        (4, '4º Bimestre'),
    ]

    numero = models.IntegerField(choices=BIMESTRE_CHOICES, unique=True)

    def __str__(self):
        return f"{self.numero}º Bimestre"
    
    class Meta:
        verbose_name = "Bimestre"
        verbose_name_plural = "Bimestres"


# Armazena atividades pendentes de entrega.
class AtividadePendente(models.Model):
    # Campos base para gerenciamento de Tarefa:
    aluno = models.ForeignKey('Aluno', on_delete=models.CASCADE)
    
    # NOVOS CAMPOS para alinhar com a UX desejada:
    titulo = models.CharField(max_length=255) # Campo do título
    descricao = models.TextField(blank=True, default='') # Mudança para TextField e opcional
    data_limite = models.DateField(null=True, blank=True) # Prazo
    data_criacao = models.DateTimeField(auto_now_add=True)
    
    STATUS_CHOICES = [ # Choices de Status
        ('Pendente', 'Pendente'),
        ('Em Andamento', 'Em Andamento'),
        ('Concluida', 'Concluída'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pendente')

    # Remova as linhas:
    # bimestre = models.ForeignKey('Bimestre', on_delete=models.CASCADE)
    # disciplina = models.CharField(max_length=4, choices=Nota.DISCIPLINA_CHOICES)
    
    def __str__(self):
        return f"{self.aluno.name_aluno} - {self.titulo}" # Adapta o __str__
    
    class Meta:
        verbose_name = "Atividade Pendente"
        verbose_name_plural = "Atividades Pendentes"
        ordering = ['data_limite']


# Define eventos extracurriculares como palestras.
class EventoExtracurricular(models.Model):
    titulo = models.CharField(max_length=255)
    descricao = models.TextField()
    data = models.DateField()
    professor_id = models.CharField(max_length=100)  # Ou use ForeignKey para Professor se existir o modelo

    def __str__(self):
        return f"{self.titulo} ({self.data})"
    
    class Meta:
        verbose_name = "Evento extracurricular"
        verbose_name_plural = "Eventos extracurriculares"


# Armazena valores em aberto como mensalidades ou taxas, associados a um aluno.
# Adicione após o model EmprestimoLivro
class PlanejamentoSemanal(models.Model):
    DIA_SEMANA_CHOICES = [
        ('SEG', 'Segunda-feira'),
        ('TER', 'Terça-feira'),
        ('QUA', 'Quarta-feira'),
        ('QUI', 'Quinta-feira'),
        ('SEX', 'Sexta-feira'),
        ('SAB', 'Sábado'),
    ]
    
    TURNO_CHOICES = [
        ('MANHA', 'Manhã'),
        ('TARDE', 'Tarde'),
        ('NOITE', 'Noite'),
    ]

    # Usando as mesmas TURMA_CHOICES do model Aluno
    TURMA_CHOICES = (
        ("1A", "1 ANO A"),
        ("1B", "1 ANO B"),
        ("1C", "1 ANO C"),
        ("2A", "2 ANO A"),
        ("2B", "2 ANO B"),
        ("2C", "2 ANO C"),
        ("3A", "3 ANO A"),
        ("3B", "3 ANO B"),
        ("3C", "3 ANO C"),
    )

    professor = models.ForeignKey('Professor', on_delete=models.CASCADE, verbose_name="Professor Responsável")
    turma = models.CharField(max_length=2, choices=TURMA_CHOICES, verbose_name="Turma")
    disciplina = models.CharField(max_length=100, verbose_name="Disciplina")
    dia_semana = models.CharField(max_length=3, choices=DIA_SEMANA_CHOICES, verbose_name="Dia da Semana")
    data_aula = models.DateField(verbose_name="Data da Aula")
    turno = models.CharField(max_length=10, choices=TURNO_CHOICES, verbose_name="Turno")
    horario_inicio = models.TimeField(verbose_name="Horário de Início")
    horario_fim = models.TimeField(verbose_name="Horário de Término")
    conteudo = models.TextField(verbose_name="Conteúdo Programado")
    atividades = models.TextField(blank=True, verbose_name="Atividades Previstas")
    recursos = models.TextField(blank=True, verbose_name="Recursos Necessários")
    observacoes = models.TextField(blank=True, verbose_name="Observações")
    
    # Campos de controle
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.turma} - {self.disciplina} - {self.professor} - {self.data_aula}"
    
    class Meta:
        verbose_name = "Planejamento Semanal"
        verbose_name_plural = "Planejamentos Semanais"
        ordering = ['data_aula', 'horario_inicio']
        unique_together = ['turma', 'data_aula', 'horario_inicio']


# Registra advertências disciplinares
class Advertencia(models.Model):

    ADV_CHOICES = [
    ("FJI", "-Faltas injustificadas"),
    ("DSP", "-Desrespeito a colegas ou professores"),
    ("CEL", "-Uso de celular sem autorização"),
    ("RGR", "-Descumprimento das regras da escola"),
    ("AGV", "-Agressões verbais"),
    ("DPM", "-Dano leve ao patrimônio escolar"),
    ("DOB", "-Desobediência a orientações"),
    ("IND", "-Atos de indisciplina em sala"),
    ("UNI", "-Uso inadequado do uniforme"),
    ("CPM", "-Comportamento impróprio no ambiente escolar"),
    ("LGF", "-Uso de linguagem ofensiva"),
    ("FRA", "-Cola ou fraude em avaliações"),
    ("BLG", "-Bullying ou assédio"),
    ("OUTROS", "-Outros motivos"),
]

    aluno = models.ForeignKey('Aluno', on_delete=models.CASCADE)
    data = models.DateField(verbose_name="Data da advertência")
    motivo = models.CharField(max_length=255, verbose_name="Motivo", choices=ADV_CHOICES)
    observacao = models.TextField(blank=True, verbose_name="Observações")

    def __str__(self):
        return f"Advertência para {self.aluno} em {self.data}"
    
    class Meta:
        verbose_name = "Advertência"
        verbose_name_plural = "Advertências"


# Registra suspensões escolares, com início e fim da punição, motivo e observações.
class Suspensao(models.Model):

    SUSP_CHOICES = [
    ("AGF", "-Agressão física a colegas ou funcionários"),
    ("AME", "-Ameaças verbais ou físicas"),
    ("BLG-R", "-Bullying recorrente ou grave"),
    ("DSP-G", "-Desrespeito grave à autoridade escolar"),
    ("VDM", "-Vandalismo / dano intencional ao patrimônio"),
    ("SUB", "-Uso ou posse de substâncias proibidas"),
    ("REC", "-Reincidência em comportamentos advertidos"),
    ("IMP", "-Divulgação de conteúdo impróprio"),
    ("RFT", "-Roubo ou furto na escola"),
    ("BRG", "-Participação em brigas ou tumultos graves"),
    ("RSC", "-Comportamento de risco à integridade física"),
    ("PRG", "-Porte de armas ou objetos perigosos"),
    ("FAL", "-Falsificação de documentos ou assinaturas"),
    ("RES", "-Desrespeito extremo em ambiente escolar"),
    ("SEG", "-Violação grave de normas de segurança")
]

    aluno = models.ForeignKey('Aluno', on_delete=models.CASCADE)
    data_inicio = models.DateField(verbose_name="Início da suspensão")
    data_fim = models.DateField(verbose_name="Fim da suspensão")
    motivo = models.CharField(max_length=255, verbose_name="Motivo", choices=SUSP_CHOICES)
    observacao = models.TextField(blank=True, verbose_name="Observações")

    def __str__(self):
        return f"Suspensão de {self.aluno} ({self.data_inicio} a {self.data_fim})"
    
    class Meta:
        verbose_name = "Suspensão"
        verbose_name_plural = "Suspensões"
    

# Gerencia eventos do calendário escolar como provas, trabalhos, feriados ou outras datas importantes.
class EventoCalendario(models.Model):
    EVENTO_CHOICES = [
        ('prova', 'Prova'),
        ('trabalho', 'Entrega de Trabalho'),
        ('feriado', 'Feriado'),
        ('evento', 'Evento'),
    ]
    titulo = models.CharField(max_length=100)
    descricao = models.TextField(blank=True)
    data = models.DateField()
    tipo = models.CharField(max_length=10, choices=EVENTO_CHOICES)

    def __str__(self):
        return f"{self.titulo} ({self.get_tipo_display()}) - {self.data}"
    
    class Meta:
        verbose_name = "Evento do calendário"
        verbose_name_plural = "Eventos do calendário"

class Livro(models.Model):
    titulo = models.CharField(max_length=255)
    autor = models.CharField(max_length=100)
    data_publicacao = models.DateField(null=True, blank=True) # <<< TORNADO OPCIONAL
    
    # 🟢 CAMPOS ADICIONADOS (Necessários para o seu Frontend)
    isbn = models.CharField(max_length=17, blank=True, null=True, unique=True)
    exemplares_disponiveis = models.IntegerField(default=1)
    
    # Adicione a classe Meta, se aplicável, para verbose_name/ordering, etc.

    def __str__(self):
        return self.titulo
    
class EmprestimoLivro(models.Model):
    TIPO_CHOICES = (
        ('livro', 'Livro'),
        ('computador', 'Computador'),
    )
    aluno = models.ForeignKey('Aluno', on_delete=models.CASCADE)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='livro')
    livro = models.ForeignKey('Livro', on_delete=models.CASCADE, blank=True, null=True)
    computador = models.CharField(max_length=100, blank=True, null=True, help_text="Identificação do computador")
    data_emprestimo = models.DateField(auto_now_add=True)
    data_devolucao = models.DateField(blank=True, null=True)
    devolvido = models.BooleanField(default=False)

    def __str__(self):
        if self.tipo == 'livro' and self.livro:
            return f"Livro: {self.livro.titulo} - {self.aluno.name_aluno} - {'Devolvido' if self.devolvido else 'Em posse'}"
        elif self.tipo == 'computador' and self.computador:
            return f"Computador: {self.computador} - {self.aluno.name_aluno} - {'Devolvido' if self.devolvido else 'Em posse'}"
        return f"{self.aluno.name_aluno} - {self.tipo}"
    
    class Meta:
        verbose_name = "Empréstimo de Livro ou Computador"
        verbose_name_plural = "Empréstimos de Livros ou Computadores"

class PasswordResetToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Token for {self.user.username}"
    
class Sala(models.Model):
    TIPO_CHOICES = [
        ('SALA', 'Sala de Aula'),
        ('LAB', 'Laboratório'),
        ('QUADRA', 'Quadra/Espaço Esportivo'),
    ]
    nome = models.CharField(max_length=100, unique=True, verbose_name="Nome da Sala")
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default='SALA')
    capacidade = models.IntegerField(default=30)
    recursos = models.TextField(blank=True, verbose_name="Recursos (Ex: Projetor, 30 PCs)")

    def __str__(self):
        return f"{self.nome} ({self.get_tipo_display()})"

class Reserva(models.Model):
    sala = models.ForeignKey(Sala, on_delete=models.CASCADE)
    professor = models.ForeignKey('Professor', on_delete=models.CASCADE)
    data = models.DateField()
    horario_inicio = models.TimeField()
    horario_fim = models.TimeField()
    finalidade = models.CharField(max_length=255, verbose_name="Finalidade da Reserva")
    
    class Meta:
        verbose_name = "Reserva de Sala"
        verbose_name_plural = "Reservas de Salas"
        unique_together = ('sala', 'data', 'horario_inicio')