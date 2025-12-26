import { BookOpen, PenTool, Library, GraduationCap, Award } from 'lucide-react';

export function LogoTicker() {
  const icons = [
    { icon: BookOpen, label: 'Editora Alpha' },
    { icon: PenTool, label: 'Revisão Prime' },
    { icon: Library, label: 'Academic Flow' },
    { icon: GraduationCap, label: 'UniDocs' },
    { icon: Award, label: 'Premium Papers' },
    // Repetir para o loop infinito
    { icon: BookOpen, label: 'Editora Alpha' },
    { icon: PenTool, label: 'Revisão Prime' },
    { icon: Library, label: 'Academic Flow' },
    { icon: GraduationCap, label: 'UniDocs' },
    { icon: Award, label: 'Premium Papers' },
  ];

  return (
    <div className="w-full py-10 bg-white border-b border-slate-100 overflow-hidden relative">
      {/* Máscaras de gradiente para suavizar as bordas */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10"></div>
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10"></div>

      <div className="flex w-full">
        <div className="flex min-w-full animate-scroll gap-16 items-center">
          {icons.map((Item, idx) => (
            <div key={idx} className="flex items-center gap-2 group cursor-default">
              <Item.icon className="h-6 w-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <span className="text-lg font-semibold text-slate-400 group-hover:text-slate-900 transition-colors whitespace-nowrap">
                {Item.label}
              </span>
            </div>
          ))}
        </div>
        {/* Duplicata para garantir o loop sem buracos */}
        <div className="flex min-w-full animate-scroll gap-16 items-center" aria-hidden="true">
          {icons.map((Item, idx) => (
            <div key={`dup-${idx}`} className="flex items-center gap-2 group">
              <Item.icon className="h-6 w-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <span className="text-lg font-semibold text-slate-400 group-hover:text-slate-900 transition-colors whitespace-nowrap">
                {Item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
