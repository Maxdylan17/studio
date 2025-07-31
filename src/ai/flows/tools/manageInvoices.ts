
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs, query, where, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import type { Invoice } from '@/lib/definitions';

const getInvoiceByDetails = async (userId: string, details: { clientName?: string, invoiceKey?: string, invoiceId?: string }) => {
    let q = query(collection(db, "invoices"), where('userId', '==', userId));

    if (details.invoiceId) {
        const docSnap = await getDocs(query(q, where('__name__', '==', details.invoiceId)));
        if (!docSnap.empty) {
            const invoiceDoc = docSnap.docs[0];
            return { id: invoiceDoc.id, ...invoiceDoc.data() } as Invoice;
        }
    }

    if (details.invoiceKey) {
        q = query(q, where('key', '==', details.invoiceKey));
    }
    
    if (details.clientName) {
        q = query(q, where('client', '==', details.clientName));
    }

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    
    const invoiceDoc = querySnapshot.docs[0]; // Assume the first result is the one
    return { id: invoiceDoc.id, ...invoiceDoc.data() } as Invoice;
};

export const cancelInvoiceTool = ai.defineTool(
  {
    name: 'cancelInvoiceTool',
    description: 'Cancela uma nota fiscal existente. Use para atender a pedidos como "cancelar a nota X".',
    inputSchema: z.object({
      invoiceId: z.string().optional().describe("O ID da nota fiscal a ser cancelada."),
      clientName: z.string().optional().describe("O nome do cliente da nota fiscal a ser cancelada."),
      invoiceKey: z.string().optional().describe("A chave de acesso da nota a ser cancelada."),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        message: z.string(),
    }),
  },
  async (input) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        return { success: false, message: "Usuário não autenticado." };
    }

    if (!input.invoiceId && !input.clientName && !input.invoiceKey) {
        return { success: false, message: "É necessário fornecer o ID, a chave da nota ou o nome do cliente para encontrar a nota." };
    }

    try {
        const invoice = await getInvoiceByDetails(currentUser.uid, input);

        if (!invoice) {
            return { success: false, message: 'Nota fiscal não encontrada com os detalhes fornecidos.' };
        }
        
        if (invoice.status === 'cancelada') {
            return { success: true, message: 'Esta nota fiscal já foi cancelada.' };
        }

        const invoiceRef = doc(db, "invoices", invoice.id);
        await updateDoc(invoiceRef, { status: 'cancelada' });

        return { success: true, message: `A nota fiscal para ${invoice.client} no valor de R$ ${invoice.value.toLocaleString('pt-BR')} foi cancelada com sucesso.` };

    } catch (error) {
      console.error("Error canceling invoice with tool: ", error);
      return { success: false, message: `Falha ao cancelar a nota. Detalhes: ${(error as Error).message}` };
    }
  }
);


export const reissueInvoiceTool = ai.defineTool(
    {
      name: 'reissueInvoiceTool',
      description: 'Reemite (duplica) uma nota fiscal existente, criando uma nova como rascunho. Use para atender a pedidos como "reemitir a nota fiscal Y".',
      inputSchema: z.object({
        invoiceId: z.string().optional().describe("O ID da nota fiscal a ser reemitida."),
        clientName: z.string().optional().describe("O nome do cliente da nota fiscal a ser reemitida."),
        invoiceKey: z.string().optional().describe("A chave de acesso da nota a ser reemitida."),
      }),
      outputSchema: z.object({
        success: z.boolean(),
        message: z.string(),
        newInvoiceId: z.string().optional(),
      }),
    },
    async (input) => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, message: "Usuário não autenticado." };
      }
  
       if (!input.invoiceId && !input.clientName && !input.invoiceKey) {
        return { success: false, message: "É necessário fornecer o ID, a chave da nota ou o nome do cliente para encontrar a nota a ser reemitida." };
    }

      try {
        const originalInvoice = await getInvoiceByDetails(currentUser.uid, input);
        if (!originalInvoice) {
          return { success: false, message: 'Nota fiscal original não encontrada.' };
        }
  
        const { id, key, status, date, ...restOfInvoice } = originalInvoice;

        const newInvoice: Omit<Invoice, 'id'> = {
            ...restOfInvoice,
            key: `NFE352407${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`,
            date: new Date().toISOString().split('T')[0],
            status: 'rascunho', // New invoice is a draft
        };
  
        const docRef = await addDoc(collection(db, "invoices"), newInvoice);
  
        return { 
            success: true, 
            message: `Nota fiscal reemitida com sucesso como um rascunho. A nova nota fiscal para ${newInvoice.client} foi criada.`,
            newInvoiceId: docRef.id
        };
  
      } catch (error) {
        console.error("Error reissuing invoice with tool: ", error);
        return { success: false, message: `Falha ao reemitir a nota. Detalhes: ${(error as Error).message}` };
      }
    }
  );
