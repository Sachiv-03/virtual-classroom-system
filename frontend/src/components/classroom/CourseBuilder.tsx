import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Plus, PlayCircle, Clock, Trash2, Edit2, Check, X, FileText } from 'lucide-react';
import { addCourseUnit, updateCourseUnit, deleteCourseUnit, addCourseTopic } from '@/services/courseService';
import { toast } from 'sonner';

interface Topic {
    id: string;
    title: string;
    duration: string;
    videoUrl: string;
    completed: boolean;
}

interface Unit {
    id: string;
    _id: string;
    title: string;
    topics: Topic[];
}

interface CourseBuilderProps {
    courseId: string;
    initialUnits: Unit[];
    onUpdate: (newUnits: Unit[]) => void;
    isTeacher: boolean;
}

export function CourseBuilder({ courseId, initialUnits, onUpdate, isTeacher }: CourseBuilderProps) {
    const [units, setUnits] = useState<Unit[]>(initialUnits || []);
    const [isAddingUnit, setIsAddingUnit] = useState(false);
    const [newUnitTitle, setNewUnitTitle] = useState("");
    
    // Edit states
    const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
    const [editUnitTitle, setEditUnitTitle] = useState("");
    
    // Topic Add states
    const [addingTopicToUnitId, setAddingTopicToUnitId] = useState<string | null>(null);
    const [newTopicData, setNewTopicData] = useState({ title: '', duration: '', videoUrl: '' });

    const handleAddUnit = async () => {
        if (!newUnitTitle.trim()) return;
        try {
            const res = await addCourseUnit(courseId, newUnitTitle.trim());
            setUnits(res.data.units);
            onUpdate(res.data.units);
            setIsAddingUnit(false);
            setNewUnitTitle("");
            toast.success("Unit added");
        } catch (error) {
            toast.error("Failed to add unit");
        }
    };

    const handleUpdateUnit = async (unitId: string) => {
        if (!editUnitTitle.trim()) return;
        try {
            const res = await updateCourseUnit(courseId, unitId, editUnitTitle.trim());
            setUnits(res.data.units);
            onUpdate(res.data.units);
            setEditingUnitId(null);
            toast.success("Unit updated");
        } catch (error) {
            toast.error("Failed to update unit");
        }
    };

    const handleDeleteUnit = async (unitId: string) => {
        if (!confirm("Are you sure you want to delete this unit and all its topics?")) return;
        try {
            const res = await deleteCourseUnit(courseId, unitId);
            setUnits(res.data.units);
            onUpdate(res.data.units);
            toast.success("Unit deleted");
        } catch (error) {
            toast.error("Failed to delete unit");
        }
    };

    const handleAddTopic = async (unitId: string) => {
        if (!newTopicData.title.trim()) return;
        try {
            const res = await addCourseTopic(courseId, unitId, newTopicData);
            setUnits(res.data.units);
            onUpdate(res.data.units);
            setAddingTopicToUnitId(null);
            setNewTopicData({ title: '', duration: '', videoUrl: '' });
            toast.success("Topic added");
        } catch (error) {
            toast.error("Failed to add topic");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
                <div>
                    <h3 className="text-lg font-bold">Course Syllabus</h3>
                    <p className="text-sm text-muted-foreground">Manage the content and structure of your course.</p>
                </div>
                {isTeacher && (
                    <Button onClick={() => setIsAddingUnit(true)} className="gap-2">
                        <Plus className="h-4 w-4" /> Add Unit
                    </Button>
                )}
            </div>

            {isAddingUnit && (
                <Card className="border-primary/50 shadow-md">
                    <CardHeader className="py-3 px-4 bg-muted/30">
                        <CardTitle className="text-sm font-medium">Create New Unit</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex gap-2 items-center">
                        <Input 
                            placeholder="E.g., Week 1: Introduction to Next.js" 
                            value={newUnitTitle} 
                            onChange={(e) => setNewUnitTitle(e.target.value)}
                            autoFocus
                        />
                        <Button onClick={handleAddUnit} size="sm">Save</Button>
                        <Button onClick={() => setIsAddingUnit(false)} variant="ghost" size="sm">Cancel</Button>
                    </CardContent>
                </Card>
            )}

            {units.length === 0 && !isAddingUnit ? (
                <div className="text-center py-12 bg-muted/20 border-2 border-dashed rounded-xl">
                    <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No syllabus content yet.</p>
                    {isTeacher && <p className="text-sm text-muted-foreground/80 mt-1">Start by adding your first unit.</p>}
                </div>
            ) : (
                <Accordion type="multiple" className="space-y-3">
                    {units.map((unit, index) => (
                        <Card key={unit._id || unit.id} className="overflow-hidden border shadow-sm group">
                            <div className="flex items-center justify-between pr-4 bg-muted/10 border-b">
                                <AccordionItem value={unit._id || unit.id} className="border-b-0 flex-1">
                                    <AccordionTrigger className="hover:no-underline py-3 px-4 data-[state=open]:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary font-bold text-sm shrink-0">
                                                {index + 1}
                                            </div>
                                            {editingUnitId === (unit._id || unit.id) ? (
                                                <div className="flex items-center gap-2 flex-1 mr-4" onClick={(e) => e.stopPropagation()}>
                                                    <Input 
                                                        value={editUnitTitle} 
                                                        onChange={(e) => setEditUnitTitle(e.target.value)}
                                                        className="h-8 shadow-none"
                                                        autoFocus
                                                    />
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleUpdateUnit(unit._id || unit.id)}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setEditingUnitId(null)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="font-semibold text-left">{unit.title}</span>
                                            )}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-0 pb-0">
                                        <div className="p-0 space-y-0 divide-y divide-border/50">
                                            {unit.topics && unit.topics.map((topic, tIdx) => (
                                                <div key={topic.id} className="flex items-start gap-3 p-4 hover:bg-muted/10 transition-colors">
                                                    <div className="mt-0.5"><PlayCircle className="h-5 w-5 text-muted-foreground shrink-0" /></div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium">{topic.title}</p>
                                                        <div className="flex items-center gap-3 mt-1.5 opacity-70">
                                                            {topic.duration && (
                                                                <span className="text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> {topic.duration}</span>
                                                            )}
                                                            {topic.videoUrl && (
                                                                <a href={topic.videoUrl} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-primary hover:underline">
                                                                    View Resource
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {unit.topics?.length === 0 && !addingTopicToUnitId && (
                                                <div className="p-4 text-center text-sm text-muted-foreground italic">
                                                    No topics added to this unit yet.
                                                </div>
                                            )}

                                            {addingTopicToUnitId === (unit._id || unit.id) && (
                                                <div className="p-4 bg-muted/20 space-y-3">
                                                    <Input 
                                                        placeholder="Topic Title (e.g., Understanding Props)"
                                                        value={newTopicData.title}
                                                        onChange={e => setNewTopicData({...newTopicData, title: e.target.value})}
                                                    />
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Input 
                                                            placeholder="Duration (e.g., 10:30)"
                                                            value={newTopicData.duration}
                                                            onChange={e => setNewTopicData({...newTopicData, duration: e.target.value})}
                                                        />
                                                        <Input 
                                                            placeholder="Video/Resource URL (Optional)"
                                                            value={newTopicData.videoUrl}
                                                            onChange={e => setNewTopicData({...newTopicData, videoUrl: e.target.value})}
                                                        />
                                                    </div>
                                                    <div className="flex justify-end gap-2 pt-2">
                                                        <Button variant="ghost" size="sm" onClick={() => setAddingTopicToUnitId(null)}>Cancel</Button>
                                                        <Button size="sm" onClick={() => handleAddTopic(unit._id || unit.id)}>Save Topic</Button>
                                                    </div>
                                                </div>
                                            )}

                                            {isTeacher && addingTopicToUnitId !== (unit._id || unit.id) && (
                                                <div className="p-2 border-t border-border bg-muted/5 flex justify-center">
                                                    <Button variant="ghost" size="sm" className="text-xs text-primary w-full" onClick={() => setAddingTopicToUnitId(unit._id || unit.id)}>
                                                        <Plus className="h-3 w-3 mr-1" /> Add Topic
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                {isTeacher && editingUnitId !== (unit._id || unit.id) && (
                                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setEditingUnitId(unit._id || unit.id); setEditUnitTitle(unit.title); }}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => handleDeleteUnit(unit._id || unit.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </Accordion>
            )}
        </div>
    );
}
