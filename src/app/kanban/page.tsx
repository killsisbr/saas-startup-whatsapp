"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Plus, MoreHorizontal, Calendar } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import NewTaskModal from "@/components/modals/NewTaskModal";
import NewColumnModal from "@/components/modals/NewColumnModal";

export default function KanbanProjetosPage() {
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Meus Projetos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [projectId, setProjectId] = useState("");

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data && data.length > 0) {
        setColumns(data[0].columns || []);
        setProjectId(data[0].id);
      }
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Local optimistic update
    const sourceColIndex = columns.findIndex(c => c.id === source.droppableId);
    const destColIndex = columns.findIndex(c => c.id === destination.droppableId);
    
    if (sourceColIndex === -1 || destColIndex === -1) return;

    const sourceCol = columns[sourceColIndex];
    const destCol = columns[destColIndex];
    
    const sourceCards = [...sourceCol.cards];
    const destCards = source.droppableId === destination.droppableId ? sourceCards : [...destCol.cards];

    const [draggedCard] = sourceCards.splice(source.index, 1);
    
    // Update local columnId optimistic
    draggedCard.columnId = destination.droppableId;
    destCards.splice(destination.index, 0, draggedCard);

    const newColumns = [...columns];
    newColumns[sourceColIndex] = { ...sourceCol, cards: sourceCards };
    newColumns[destColIndex] = { ...destCol, cards: destCards };

    setColumns(newColumns);

    // API Call
    if (source.droppableId !== destination.droppableId) {
      try {
        await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: draggableId, columnId: destination.droppableId }),
        });
      } catch (error) {
        console.error("Erro ao mover card:", error);
        fetchProjects(); // Revert on failure
      }
    }
  };

  if (loading) return <div className="text-white p-8">Carregando Projetos...</div>;

  const stageStyles: Record<string, { color: string, dot: string }> = {
    "A Fazer": { color: "bg-blue-500", dot: "bg-blue-500" },
    "Em Andamento": { color: "bg-purple-500", dot: "bg-purple-500" },
    "Em Revisão": { color: "bg-orange-500", dot: "bg-orange-500" },
    "Concluído": { color: "bg-emerald-500", dot: "bg-emerald-500" },
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Kanban <span className="text-zinc-500">/ Projetos</span>
          </h1>
          
          <div className="flex gap-2">
            {["Meus Projetos", "Urgente", "Todos"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filter === f 
                  ? 'bg-white/10 text-white border border-white/20' 
                  : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <Button 
           variant="neon" 
           size="lg" 
           className="gap-2 shrink-0 bg-primary/20 text-primary hover:bg-primary/30 border-primary/50 shadow-none"
           onClick={() => setIsColumnModalOpen(true)}
        >
          <Plus size={18} />
          Nova Coluna
        </Button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar flex-1 min-h-[70vh]">
        <DragDropContext onDragEnd={onDragEnd}>
          {columns.map((column) => {
            const style = stageStyles[column.title] || { color: "bg-zinc-500", dot: "bg-zinc-500" };

            return (
              <div key={column.id} className="min-w-[320px] w-[320px] flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${style.dot} shadow-neon`} />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">{column.title}</h3>
                      <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                        {column.cards?.length || 0}
                      </span>
                   </div>
                   <button className="text-zinc-500 hover:text-white transition-colors">
                     <MoreHorizontal size={16} />
                   </button>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className={`flex flex-col gap-4 flex-1 p-1 rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-white/5' : ''}`}
                    >
                      {column.cards?.map((task: any, index: number) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{ 
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.9 : 1
                              }}
                            >
                              <Card 
                                 className={`flex flex-col gap-4 group transition-all p-5 cursor-pointer ${snapshot.isDragging ? 'border-primary shadow-xl shadow-primary/10' : 'hover:border-white/20'}`}
                                 onClick={() => {
                                   setEditingTask(task);
                                   setIsModalOpen(true);
                                 }}
                              >
                                 <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="info" className="uppercase tracking-wider text-[9px]">
                                      {task.priority || "NORMAL"}
                                    </Badge>
                                 </div>
                                 
                                 <div className="flex flex-col gap-1.5">
                                    <h4 className="text-base font-bold text-white tracking-tight group-hover:text-primary transition-colors">
                                      {task.title}
                                    </h4>
                                    {task.description && (
                                      <p className="text-xs text-zinc-400 font-medium leading-relaxed mt-1">
                                        {task.description}
                                      </p>
                                    )}
                                 </div>
                                 
                                 <div className="flex flex-col gap-2 mt-2">
                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                       <span className="text-zinc-500">Progresso</span>
                                       <span className="text-white">{task.progress || 0}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                       <div 
                                         className={`h-full rounded-full ${style.color}`} 
                                         style={{ width: `${task.progress || 0}%` }} 
                                       />
                                    </div>
                                 </div>

                                 <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                    <div className="flex items-center -space-x-2">
                                      <div
                                        className="w-7 h-7 rounded-full border-2 border-[#09090b] flex items-center justify-center text-[10px] font-bold text-white"
                                        style={{ backgroundColor: `hsl(${(task.title || '').charCodeAt(0) * 37 % 360}, 60%, 45%)` }}
                                      >
                                        {(task.title || 'T')[0].toUpperCase()}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                                       <Calendar size={12} />
                                       {task.date || new Date(task.createdAt).toLocaleDateString()}
                                    </div>
                                 </div>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      <button 
                         className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/5 text-zinc-600 hover:border-white/20 hover:text-white transition-all text-sm font-medium mt-2"
                         onClick={() => {
                            setEditingTask(null);
                            setIsModalOpen(true);
                         }}
                      >
                         <Plus size={16} />
                         Novo Card
                      </button>
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </DragDropContext>
      </div>

      <NewTaskModal 
        isOpen={isModalOpen} 
        onClose={() => {
           setIsModalOpen(false);
           setTimeout(() => setEditingTask(null), 300);
        }} 
        onSuccess={fetchProjects} 
        initialData={editingTask}
      />
      
      <NewColumnModal 
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        onSuccess={fetchProjects}
        projectId={projectId}
      />
    </div>
  );
}
