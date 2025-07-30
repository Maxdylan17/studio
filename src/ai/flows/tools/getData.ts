
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import type { Invoice } from '@/lib/definitions';

const DataTypeSchema = z.enum(['invoices', 'clients']);

export const getDataTool = ai.defineTool(
  {
    name: 'getData',
    description: 'Busca dados de notas fiscais (invoices) ou clientes (clients) do banco de dados do usuário autenticado. Use para responder perguntas sobre faturamento, clientes, etc.',
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
    // IMPORTANT: This is a mocked auth object for demonstration.
    // In a real app, you would get the current user from your authentication context.
    const currentUser = auth.currentUser;
    if (!currentUser) {
        return { error: "Usuário não autenticado." };
    }
    const userId = currentUser.uid;

    try {
      // All queries must be filtered by the current user's ID for security.
      let q = query(collection(db, input.dataType), where('userId', '==', userId));
      
      if (input.filters) {
        input.filters.forEach(filter => {
          // Prevent querying by userId directly in filters
          if (filter.field.toLowerCase() === 'userid') return;
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

      // Remove userId from results to save tokens and avoid exposing it to the LLM.
      return data.map((item: any) => {
        const { userId, ...rest } = item;
        return rest;
      });

    } catch (error) {
      console.error("Error fetching data with tool: ", error);
      return { error: 'Falha ao buscar os dados.', details: (error as Error).message };
    }
  }
);
