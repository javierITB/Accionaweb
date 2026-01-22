import React from 'react';
import {
  Type,
  CheckSquare,
  Circle,
  Hash,
  Clock,
  ChevronDown,
  IdCard
} from 'lucide-react';

const questionTypes = [
  {
    id: 'text',
    name: 'Texto',
    icon: Type,
    description: 'Respuesta de texto libre'
  },
  {
    id: 'multiple-choice',
    name: 'Selección Múltiple',
    icon: CheckSquare,
    description: 'Varias opciones seleccionables'
  },
  {
    id: 'single-choice',
    name: 'Selección Única',
    icon: Circle,
    description: 'Una sola opción (radio buttons)'
  },
  {
    id: 'dropdown',
    name: 'Menú Desplegable',
    icon: ChevronDown,
    description: 'Lista desplegable de opciones'
  },
  {
    id: 'number',
    name: 'Número',
    icon: Hash,
    description: 'Entrada numérica'
  },
  {
    id: 'date',
    name: 'Fecha',
    icon: Calendar,
    description: 'Selector de fecha'
  },
  {
    id: 'time',
    name: 'Hora',
    icon: Clock,
    description: 'Selector de hora'
  },
  {
    id: 'rut',
    name: 'Rut',
    icon: IdCard,
    description: 'Entrada con formato RUT Chileno'
  }
];

const QuestionTypePanel = ({ onAddQuestion }) => {
  const handleAddQuestion = (type) => {
    onAddQuestion(type);
  };

  return (
    <div className="p-4 space-y-2">
      {questionTypes?.map((type) => {
        const IconComponent = type?.icon;
        return (
          <button
            key={type?.id}
            onClick={() => handleAddQuestion(type?.id)}
            className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            title={`Agregar pregunta de tipo ${type?.name}`}
          >
            <div className="flex items-start space-x-3">
              <div className="p-1 rounded bg-gray-100 group-hover:bg-blue-100 transition-colors">
                <IconComponent size={16} className="text-gray-600 group-hover:text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-900">
                  {type?.name}
                </h4>
                <p className="text-xs text-gray-600 group-hover:text-blue-700 mt-1">
                  {type?.description}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default QuestionTypePanel;