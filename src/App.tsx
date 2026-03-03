import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Download, 
  User, 
  Stethoscope, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  ExternalLink,
  ClipboardList,
  Search
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Types ---
interface Question {
  id: number;
  text: string;
  category: 'Interview' | 'Physical Exam';
  subCategory?: string;
}

const QUESTIONS: Question[] = [
  // Entrevista - Pregunta 1
  { id: 1, text: 'Quemazón', category: 'Interview', subCategory: 'Pregunta 1: ¿Tiene el dolor una o más de las siguientes características?' },
  { id: 2, text: 'Frío doloroso', category: 'Interview', subCategory: 'Pregunta 1: ¿Tiene el dolor una o más de las siguientes características?' },
  { id: 3, text: 'Calambres eléctricos', category: 'Interview', subCategory: 'Pregunta 1: ¿Tiene el dolor una o más de las siguientes características?' },
  
  // Entrevista - Pregunta 2
  { id: 4, text: 'Hormigueo', category: 'Interview', subCategory: 'Pregunta 2: ¿Está asociado el dolor con uno o más de los siguientes síntomas en la misma zona?' },
  { id: 5, text: 'Alfileres y agujas', category: 'Interview', subCategory: 'Pregunta 2: ¿Está asociado el dolor con uno o más de los siguientes síntomas en la misma zona?' },
  { id: 6, text: 'Entumecimiento', category: 'Interview', subCategory: 'Pregunta 2: ¿Está asociado el dolor con uno o más de los siguientes síntomas en la misma zona?' },
  { id: 7, text: 'Picazón', category: 'Interview', subCategory: 'Pregunta 2: ¿Está asociado el dolor con uno o más de los siguientes síntomas en la misma zona?' },
  
  // Examen Físico - Pregunta 3
  { id: 8, text: 'Hipoestesia al tacto', category: 'Physical Exam', subCategory: 'Pregunta 3: ¿Está el dolor localizado en una zona donde el examen físico puede mostrar una o más de las siguientes características?' },
  { id: 9, text: 'Hipoestesia a pinchazos', category: 'Physical Exam', subCategory: 'Pregunta 3: ¿Está el dolor localizado en una zona donde el examen físico puede mostrar una o más de las siguientes características?' },
  
  // Examen Físico - Pregunta 4
  { id: 10, text: 'Cepillado suave de la piel', category: 'Physical Exam', subCategory: 'Pregunta 4: En la zona dolorosa, el dolor es causado o incrementado por:' },
];

export default function App() {
  const [patientName, setPatientName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [answers, setAnswers] = useState<Record<number, boolean | null>>(
    Object.fromEntries(QUESTIONS.map(q => [q.id, null]))
  );

  const reportRef = useRef<HTMLDivElement>(null);

  const score = useMemo(() => {
    return Object.values(answers).filter(val => val === true).length;
  }, [answers]);

  const isNeuropathic = score >= 4;
  const isComplete = Object.values(answers).every(val => val !== null);

  const handleAnswerChange = (id: number, value: boolean) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add subsequent pages if content overflows
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`DN4_Reporte_${patientName.trim() || 'Paciente'}_${date}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Hubo un problema al generar el PDF. Esto puede deberse a restricciones del navegador en el entorno de vista previa. Como alternativa, puede usar el botón "Imprimir" y seleccionar "Guardar como PDF" en su impresora.');
    }
  };

  const renderQuestionGroup = (category: string, subCategory: string, startIdx: number, endIdx: number) => {
    const groupQuestions = QUESTIONS.slice(startIdx, endIdx);
    return (
      <div className="mb-8 last:mb-0">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 px-1">
          {subCategory}
        </h3>
        <div className="medical-card">
          {groupQuestions.map((q) => (
            <div key={q.id} className="question-row">
              <span className="text-slate-700 font-medium">
                {q.id}. {q.text}
              </span>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    className="radio-input"
                    checked={answers[q.id] === true}
                    onChange={() => handleAnswerChange(q.id, true)}
                  />
                  <span>SÍ</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    className="radio-input"
                    checked={answers[q.id] === false}
                    onChange={() => handleAnswerChange(q.id, false)}
                  />
                  <span>NO</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto font-sans">
      {/* Header Section */}
      <header className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-2xl mb-4">
          <Stethoscope className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-slate-900 mb-2">
          Cuestionario DN4
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Herramienta de screening para la detección de dolor neuropático.
        </p>
      </header>

      {/* Main Content Area */}
      <main ref={reportRef} className="space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        {/* Patient & Doctor Info */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-slate-100">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <User className="w-3 h-3" /> Paciente
            </label>
            <input
              type="text"
              placeholder="Nombre completo"
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Stethoscope className="w-3 h-3" /> Médico
            </label>
            <input
              type="text"
              placeholder="Nombre del facultativo"
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Calendar className="w-3 h-3" /> Fecha
            </label>
            <input
              type="date"
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </section>

        {/* Questionnaire Sections */}
        <section className="space-y-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              I
            </div>
            <h2 className="text-xl font-serif font-bold text-slate-800">ENTREVISTA</h2>
          </div>
          
          {renderQuestionGroup('Interview', 'Pregunta 1: ¿Tiene el dolor una o más de las siguientes características?', 0, 3)}
          {renderQuestionGroup('Interview', 'Pregunta 2: ¿Está asociado el dolor con uno o más de los siguientes síntomas en la misma zona?', 3, 7)}

          <div className="flex items-center gap-3 mt-12 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              II
            </div>
            <h2 className="text-xl font-serif font-bold text-slate-800">EXAMEN FÍSICO</h2>
          </div>

          {renderQuestionGroup('Physical Exam', 'Pregunta 3: ¿Está el dolor localizado en una zona donde el examen físico puede mostrar una o más de las siguientes características?', 7, 9)}
          {renderQuestionGroup('Physical Exam', 'Pregunta 4: En la zona dolorosa, el dolor es causado o incrementado por:', 9, 10)}
        </section>

        {/* Results Section */}
        <section className="mt-12 pt-8 border-t border-slate-100">
          <div className="bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                  Resultado de la Evaluación
                </h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-6xl font-serif font-bold text-emerald-400">{score}</span>
                  <span className="text-2xl text-slate-500 font-medium">/ 10</span>
                </div>
                
                <AnimatePresence mode="wait">
                  {isComplete ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                        isNeuropathic ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {isNeuropathic ? (
                        <><AlertCircle className="w-4 h-4" /> DOLOR NEUROPÁTICO PROBABLE</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4" /> DOLOR NEUROPÁTICO IMPROBABLE</>
                      )}
                    </motion.div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-slate-800 text-slate-500">
                      <ClipboardList className="w-4 h-4" /> CUESTIONARIO INCOMPLETO
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <div className="max-w-xs text-sm text-slate-400 leading-relaxed italic">
                {isNeuropathic 
                  ? "Una puntuación ≥ 4 sugiere la presencia de un componente de dolor neuropático."
                  : "Una puntuación < 4 sugiere que el dolor es probablemente nociceptivo."}
              </div>
            </div>
          </div>
        </section>

        {/* Interpretation Note */}
        <div className="mt-6 flex gap-3 p-4 bg-blue-50 rounded-2xl text-blue-800 text-xs leading-relaxed">
          <Info className="w-5 h-5 shrink-0 text-blue-400" />
          <p>
            <strong>Nota:</strong> Este cuestionario es una herramienta de screening. El diagnóstico final debe ser realizado por un profesional médico cualificado basándose en la historia clínica completa y pruebas complementarias si fuesen necesarias.
          </p>
        </div>
      </main>

      {/* Action Buttons & Footer */}
      <footer className="mt-12 space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={exportToPDF}
            disabled={!isComplete}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg ${
              isComplete 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 active:scale-95 cursor-pointer' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Download className="w-5 h-5" />
            Exportar Reporte PDF
          </button>
          
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
          >
            <FileText className="w-5 h-5" />
            Imprimir
          </button>
        </div>

        {/* Bibliography Section */}
        <div className="pt-12 border-t border-slate-200">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">
            Referencias Bibliográficas
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a 
              href="https://1aria.com/entrada/test-dn4-para-screenning-para-dolor" 
              target="_blank" 
              rel="noopener noreferrer"
              className="medical-card p-4 flex items-start gap-4 hover:border-emerald-200 transition-all group"
            >
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-emerald-50 transition-colors">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1">
                  1ARIA <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Test DN4 para screening de dolor neuropático. Información clínica y criterios de evaluación.
                </p>
              </div>
            </a>

            <a 
              href="https://www.physiotutors.com/es/questionnaires/dn4-questionnaire-neuropathic-pain/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="medical-card p-4 flex items-start gap-4 hover:border-emerald-200 transition-all group"
            >
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-emerald-50 transition-colors">
                <ClipboardList className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1">
                  Physiotutors <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Cuestionario DN4 (Dolor Neuropático 4). Bibliografía original y validación del instrumento.
                </p>
              </div>
            </a>
          </div>
          
          <p className="mt-8 text-center text-[10px] text-slate-400 italic">
            Bouhassira D, et al. Comparison of pain syndromes associated with nervous or somatic lesions and development of a new neuropathic pain diagnostic questionnaire (DN4). Pain. 2005;114(1-2):29-36.
          </p>
        </div>
      </footer>
    </div>
  );
}
