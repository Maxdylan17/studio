
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Send, Bot, User, BrainCircuit, MessageSquare, RefreshCw } from 'lucide-react';
import { handleConversationalAnalysis } from '@/lib/actions';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type Message = {
    role: 'user' | 'assistant';
    content: string;
}

const examplePrompts = [
    "Liste minhas 5 últimas notas fiscais emitidas.",
    "Qual cliente mais recente foi cadastrado?",
    "Qual o valor total das notas para o cliente 'Empresa Exemplo'?",
    "Existem notas fiscais com status 'cancelada'?"
]

export default function RelatoriosPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSendMessage = async (prompt?: string) => {
        const userMessage = prompt || input;
        if (!userMessage.trim()) return;
        
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);
        setInput('');

        try {
            const result = await handleConversationalAnalysis({ query: userMessage });
            setMessages(prev => [...prev, { role: 'assistant', content: result.answer }]);
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: "Erro na Análise",
                description: "Não foi possível processar sua pergunta. Tente novamente."
            });
            setMessages(prev => [...prev, { role: 'assistant', content: "Desculpe, ocorreu um erro ao processar sua solicitação." }]);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6 animate-in fade-in-0">
            <div className="flex items-center justify-between space-y-2">
                <div className='flex items-end gap-3'>
                    <BrainCircuit className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Assistente Fiscal IA</h1>
                        <p className="text-muted-foreground">Tire suas dúvidas sobre faturas, pagamentos e muito mais.</p>
                    </div>
                </div>
            </div>
            
            <Card className="h-[calc(100vh-12rem)] flex flex-col">
                <CardContent className="flex-1 p-6 overflow-y-auto space-y-6">
                    {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                            <h3 className="text-lg font-semibold mb-2">Como posso ajudar?</h3>
                            <p className="text-sm max-w-md mx-auto mb-6">Faça perguntas sobre suas notas fiscais, faturas e dados de faturamento.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
                                {examplePrompts.map(prompt => (
                                    <Button 
                                        key={prompt}
                                        variant="outline" 
                                        className="text-left h-auto py-2"
                                        onClick={() => handleSendMessage(prompt)}
                                    >
                                        {prompt}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                {message.role === 'assistant' && (
                                    <div className="bg-primary text-primary-foreground rounded-full p-2">
                                        <Bot className="h-5 w-5" />
                                    </div>
                                )}
                                <div className={`max-w-xl rounded-lg p-3 ${message.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-card border'}`}>
                                    <article className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown
                                            components={{
                                                table: ({node, ...props}) => <table className="table-auto w-full" {...props} />,
                                                thead: ({node, ...props}) => <thead className="bg-muted" {...props} />,
                                                tr: ({node, ...props}) => <tr className="border-b" {...props} />,
                                                th: ({node, ...props}) => <th className="p-2 text-left font-medium" {...props} />,
                                                td: ({node, ...props}) => <td className="p-2" {...props} />,

                                            }}
                                        >{message.content}</ReactMarkdown>
                                    </article>
                                </div>
                                {message.role === 'user' && (
                                    <div className="bg-muted text-muted-foreground rounded-full p-2">
                                        <User className="h-5 w-5" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {loading && (
                        <div className="flex items-start gap-4">
                            <div className="bg-primary text-primary-foreground rounded-full p-2">
                                <Bot className="h-5 w-5" />
                            </div>
                            <div className="max-w-xl rounded-lg p-3 bg-card border w-full">
                                <Skeleton className="h-4 w-1/4" />
                            </div>
                        </div>
                    )}
                </CardContent>
                <div className="border-t p-4">
                    <div className="relative">
                        <Input
                            placeholder="Qual o valor da minha última fatura?"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={loading}
                            className="pr-12"
                        />
                        <Button 
                            type="submit" 
                            size="icon" 
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() => handleSendMessage()}
                            disabled={loading || !input.trim()}
                        >
                            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
