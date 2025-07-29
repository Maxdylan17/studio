
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Invoice } from '@/lib/definitions';

const FAKE_USER_ID = "local-user";

const DataTypeSchema = z.enum(['invoices', 'clients']);

export const getDataTool = ai.defineTool(
  {
    name: 'getData',
    description: 'Busca dados de notas fiscais (invoices) ou clientes (clients) do banco de dados. Use para responder perguntas sobre faturamento, clientes, etc.',
    inputSchema: z.object({
      dataType: DataTypeSchema.describe("O tipo de dado para buscar: 'invoices' ou 'clients'."),
      filters: z.array(z.object({
        field: z.string(),
        operator: z.enum(['==', '!=', '<', '<=', '>', '>=', 'array-contains']),
        value: z.any(),
      })).optional().describe("Filtros a serem aplicados na busca."),
      ordering: z.object({
        by: z.string(),
        direction: z.enum(['asc', 'desc']).optional(),
      }).optional().describe("Critério de ordenação dos resultados."),
      limit: z.number().optional().describe("Número máximo de resultados a serem retornados."),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    try {
      let q = query(collection(db, input.dataType), where('userId', '==', FAKE_USER_ID));
      
      if (input.filters) {
        input.filters.forEach(filter => {
          q = query(q, where(filter.field, filter.operator, filter.value));
        });
      }

      if (input.ordering) {
        q = query(q, orderBy(input.ordering.by, input.ordering.direction));
      }

      if (input.limit) {
        q = query(q, limit(input.limit));
      }

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (input.dataType === 'invoices' && data.length > 0) {
        // Remove userId from invoices to save tokens and avoid exposing it
        return data.map((invoice: any) => {
          const { userId, ...rest } = invoice;
          return rest;
        });
      }

      return data;

    } catch (error) {
      console.error("Error fetching data with tool: ", error);
      return { error: 'Failed to fetch data.', details: (error as Error).message };
    }
  }
);
