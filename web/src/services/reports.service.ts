import { classesService, classOccurrencesService, classEnrollmentsService } from '@/services/classes.service';
import { paymentsService } from '@/services/payments.service';

export interface ReportsFilters {
  data_inicio?: string; // YYYY-MM-DD
  data_fim?: string;    // YYYY-MM-DD
  esporte?: string;
  id_instrutor?: string;
  status_aula?: string;      // ativa|inativa|all
  status_pagamento?: string; // pago|pendente|cancelado|all
}

export class ReportsService {
  async fetchAll(filters: ReportsFilters = {}) {
    // Aulas (admin): usa /admin/classes quando há filtros diversos; caso simples também funciona
    const aulasResp = await classesService.list({
      status: filters.status_aula && filters.status_aula !== 'all' ? filters.status_aula : undefined,
      esporte: filters.esporte && filters.esporte !== 'all' ? filters.esporte : undefined,
      // nivel opcional no futuro
    });
    const aulas = aulasResp.data;

    // Ocorrências (admin)
    const occResp = await classOccurrencesService.list({
      id_aula: undefined,
      id_instrutor: filters.id_instrutor,
      status: undefined,
      data_inicio: filters.data_inicio,
      data_fim: filters.data_fim,
      apenas_futuras: false,
      per_page: 1000,
    });
    const ocorrencias = occResp.data;

    // Inscrições (admin)
    const enrResp = await classEnrollmentsService.list({
      id_aula: undefined,
      id_ocorrencia_aula: undefined,
      status: undefined,
    });
    const inscricoes = enrResp.data;

    // Pagamentos (admin)
    const payResp = await paymentsService.listAll({
      status: filters.status_pagamento && filters.status_pagamento !== 'all' ? (filters.status_pagamento as any) : undefined,
      tipo: 'all',
      page: 1,
      per_page: 1000,
    });
    const cobrancas = payResp.data;

    // Agregações simples
    const totalAulas = aulas.length;
    const aulasAtivas = aulas.filter(a => a.status === 'ativa').length;
    const totalHorariosSemana = aulas.reduce((acc, a) => acc + (a.horarios_count || 0), 0);

    const totalOcorrencias = ocorrencias.length;
    const totalInscricoes = inscricoes.length;

    const receitaPaga = cobrancas
      .filter(c => c.status === 'pago')
      .reduce((acc, c) => acc + Number(c.valor_total || 0), 0);
    const receitaPendente = cobrancas
      .filter(c => c.status === 'pendente')
      .reduce((acc, c) => acc + Number(c.valor_total || 0), 0);

    return {
      metrics: {
        totalAulas,
        aulasAtivas,
        totalHorariosSemana,
        totalOcorrencias,
        totalInscricoes,
        receitaPaga,
        receitaPendente,
      },
      datasets: {
        aulas,
        ocorrencias,
        inscricoes,
        cobrancas,
      },
    };
  }
}

export const reportsService = new ReportsService();
