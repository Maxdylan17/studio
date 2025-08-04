
'use server';

import { db } from './firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import type { Client, Invoice, Expense } from './definitions';
import { subMonths, format, addDays } from 'date-fns';

const sampleClients = [
    { name: 'TechSolutions Ltda', email: 'contato@techsolutions.com', phone: '(11) 98765-4321', cpf_cnpj: '12.345.678/0001-90' },
    { name: 'Inova Web Design', email: 'orcamento@inovaweb.com', phone: '(21) 91234-5678', cpf_cnpj: '98.765.432/0001-10' },
    { name: 'Marketing Digital S.A.', email: 'financeiro@marketingsa.com', phone: '(31) 95555-1234', cpf_cnpj: '55.666.777/0001-22' },
    { name: 'Consultoria e Cia', email: 'consultoria.cia@email.com', phone: '(41) 98888-7777', cpf_cnpj: '11.222.333/0001-44' },
];

function generateRandomValue(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export async function seedDataForUser(userId: string) {
    const batch = writeBatch(db);

    // 1. Create Clients
    const clientRefs = sampleClients.map(clientData => {
        const clientRef = doc(collection(db, 'clients'));
        const newClient: Omit<Client, 'id'> = {
            ...clientData,
            userId,
            avatarUrl: `https://placehold.co/100x100.png?text=${clientData.name.charAt(0)}`
        };
        batch.set(clientRef, newClient);
        return clientRef;
    });

    // 2. Create Invoices
    const now = new Date();
    const invoiceStatuses: Invoice['status'][] = ['paga', 'paga', 'paga', 'pendente', 'vencida', 'paga', 'rascunho', 'cancelada'];
    let invoiceCount = 0;

    for (let i = 0; i < 3; i++) { // For the last 3 months
        const monthDate = subMonths(now, i);
        for(let j = 0; j < generateRandomValue(3, 5); j++) { // 3 to 5 invoices per month
            const invoiceRef = doc(collection(db, 'invoices'));
            const clientIndex = invoiceCount % clientRefs.length;
            const status = invoiceStatuses[invoiceCount % invoiceStatuses.length];
            const issueDate = addDays(monthDate, generateRandomValue(1, 28));
            const value = generateRandomValue(500, 4500);

            const newInvoice: Omit<Invoice, 'id'> = {
                key: `NFE352407${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`,
                client: sampleClients[clientIndex].name,
                clientId: clientRefs[clientIndex].id,
                destinatario: {
                    nome: sampleClients[clientIndex].name,
                    cpf_cnpj: sampleClients[clientIndex].cpf_cnpj,
                },
                date: format(issueDate, 'yyyy-MM-dd'),
                dueDate: status === 'pendente' ? format(addDays(issueDate, 30), 'yyyy-MM-dd') : undefined,
                status: status,
                value: value,
                userId,
                items: [
                    { description: 'Consultoria de TI - Horas', quantity: Math.floor(value / 150), unitPrice: 150 },
                    { description: 'Desenvolvimento de Módulo X', quantity: 1, unitPrice: 0 }
                ],
                naturezaOperacao: 'Prestação de serviço',
            };
            batch.set(invoiceRef, newInvoice);
            invoiceCount++;
        }
    }


    // 3. Create Expenses
    const expenseCategories = ["Software e Assinaturas", "Marketing e Publicidade", "Fornecedores", "Impostos"];
    for (let i = 0; i < 3; i++) { // For the last 3 months
        const monthDate = subMonths(now, i);
        for(let j = 0; j < generateRandomValue(2, 4); j++) { // 2 to 4 expenses per month
            const expenseRef = doc(collection(db, 'expenses'));
            const newExpense: Omit<Expense, 'id'> = {
                userId,
                description: `Despesa de Exemplo ${i+1}-${j+1}`,
                value: generateRandomValue(100, 800),
                date: format(addDays(monthDate, generateRandomValue(1, 28)), 'yyyy-MM-dd'),
                category: expenseCategories[j % expenseCategories.length]
            };
            batch.set(expenseRef, newExpense);
        }
    }

    // 4. Create Settings
    const settingsRef = doc(db, 'settings', userId);
    batch.set(settingsRef, {
        companyName: "Minha Empresa de Exemplo",
        cnpj: "01.234.567/0001-89",
        aliquota: "6.0",
        certificatePassword: ""
    });


    // Commit the batch
    await batch.commit();
}
