import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon.jsx';

const FormPreview = ({ formData }) => {
  const [answers, setAnswers] = useState({});
  const [respaldo, setRespaldo] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [user, setUser] = useState({
    uid: '',
    nombre: '',
    empresa: '',
    token: ''
  });
  const usuario = sessionStorage.getItem("user");
  const cargo = sessionStorage.getItem("cargo");
  const mail = sessionStorage.getItem("email");
  const token = sessionStorage.getItem("token");
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await fetch(`https://accionaapi.vercel.app/api/auth/${mail}`);
        if (!res.ok) throw new Error('Usuario no encontrado');
        const data = await res.json();

        setUser({
          uid: data.id,
          nombre: usuario,
          empresa: data.empresa,
          mail: mail,
          token: token
        });
      } catch (err) {
        console.error('Error cargando el usuario:', err);
        alert('No se pudo cargar el usuario');
      }
    };

    fetchForm();
  }, []);

  const getQuestionTitle = (question) => {
    return question.title || 'Pregunta sin título';
  };

  const handleInputChange = (questionId, questionTitle, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: ''
      }));
    }
  };

  const handleFileChange = (questionId, questionTitle, files) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: files,
    }));

    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: ''
      }));
    }
  };

  const handleInputBlur = (questionId, value, isRequired) => {
    setTouched(prev => ({
      ...prev,
      [questionId]: true
    }));

    if (isRequired && !value) {
      setErrors(prev => ({
        ...prev,
        [questionId]: 'Este campo es obligatorio'
      }));
    }
  };

  const handleRadioChange = (questionId, questionTitle, optionValue) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionValue,
    }));

    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: ''
      }));
    }
  };

  const handleCheckboxChange = (questionId, questionTitle, option) => {
    setAnswers((prev) => {
      const currentAnswers = prev[questionId] || [];
      let newAnswers;

      if (currentAnswers.includes(option)) {
        newAnswers = currentAnswers.filter((o) => o !== option);
      } else {
        newAnswers = [...currentAnswers, option];
      }

      if (errors[questionId] && newAnswers.length > 0) {
        setErrors(prev => ({
          ...prev,
          [questionId]: ''
        }));
      }

      return {
        ...prev,
        [questionId]: newAnswers,
      };
    });
  };

  const validateQuestions = (questions, answers, parentPath = '') => {
    const errors = {};

    questions.forEach((question, index) => {
      const questionPath = parentPath ? `${parentPath}.${question.id}` : question.id;

      if (question.required) {
        const answer = answers[question.id];

        if (!answer ||
          (Array.isArray(answer) && answer.length === 0) ||
          answer === '') {
          errors[question.id] = 'Este campo es obligatorio';
        }
      }

      (question?.options || []).forEach((option, optionIndex) => {
        if (typeof option === 'object' && option.hasSubform && option.subformQuestions && option.subformQuestions.length > 0) {
          const optionText = option.text || `Opción ${optionIndex + 1}`;

          const shouldValidateSubsection =
            question.type === 'single_choice'
              ? answers[question.id] === optionText
              : question.type === 'multiple_choice'
                ? Array.isArray(answers[question.id]) && answers[question.id].includes(optionText)
                : false;

          if (shouldValidateSubsection) {
            const subErrors = validateQuestions(option.subformQuestions, answers, questionPath);
            Object.assign(errors, subErrors);
          }
        }
      });
    });

    return errors;
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const mapAnswersToTitles = (questions, answers, mappedAnswers = {}) => {
    questions.forEach((question) => {
      const questionTitle = getQuestionTitle(question);
      const answer = answers[question.id];

      if (answer !== undefined && answer !== null && answer !== '') {
        if (!(Array.isArray(answer) && answer.length === 0)) {
          if (question.type === 'file' && answer instanceof FileList) {
            const fileNames = Array.from(answer).map(file => file.name).join(', ');
            mappedAnswers[questionTitle] = fileNames;
          } else {
            mappedAnswers[questionTitle] = answer;
          }
        }
      }

      (question?.options || []).forEach((option) => {
        if (typeof option === 'object' && option.hasSubform && option.subformQuestions && option.subformQuestions.length > 0) {
          const optionText = option.text || 'Opción';

          const shouldProcessSubsection =
            question.type === 'single_choice'
              ? answers[question.id] === optionText
              : question.type === 'multiple_choice'
                ? Array.isArray(answers[question.id]) && answers[question.id].includes(optionText)
                : false;

          if (shouldProcessSubsection) {
            mapAnswersToTitles(option.subformQuestions, answers, mappedAnswers);
          }
        }
      });
    });

    return mappedAnswers;
  };

  const validateForm = () => {
    let newErrors = {};

    newErrors = validateQuestions(formData?.questions || [], answers);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const renderQuestion = (question, index, showNumber = true, parentPath = '') => {
    const questionPath = parentPath ? `${parentPath}.${question.id}` : question.id;
    const questionTitle = question.title || `Pregunta ${index + 1}`;
    const baseInputClass = 'w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';
    const value = answers[question.id] || '';
    const error = errors[question.id];
    const isTouched = touched[question.id];

    const renderInput = () => {
      switch (question?.type) {
        case 'text':
          return (
            <div>
              <input
                type="text"
                placeholder="Escribe tu respuesta aquí..."
                className={`${baseInputClass} ${error ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                value={value}
                onChange={(e) => handleInputChange(question.id, getQuestionTitle(question), e.target.value)}
                onBlur={(e) => handleInputBlur(question.id, e.target.value, question.required)}
              />
              {error && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <Icon name="AlertCircle" size={14} className="mr-1" />
                  {error}
                </p>
              )}
            </div>
          );

        case 'number':
          return (
            <div>
              <input
                type="number"
                placeholder="0"
                className={`${baseInputClass} ${error ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                value={value}
                onChange={(e) => handleInputChange(question.id, getQuestionTitle(question), e.target.value)}
                onBlur={(e) => handleInputBlur(question.id, e.target.value, question.required)}
              />
              {error && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <Icon name="AlertCircle" size={14} className="mr-1" />
                  {error}
                </p>
              )}
            </div>
          );

        case 'date':
          return (
            <div>
              <input
                type="date"
                className={`${baseInputClass} ${error ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                value={value}
                onChange={(e) => handleInputChange(question.id, getQuestionTitle(question), e.target.value)}
                onBlur={(e) => handleInputBlur(question.id, e.target.value, question.required)}
              />
              {error && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <Icon name="AlertCircle" size={14} className="mr-1" />
                  {error}
                </p>
              )}
            </div>
          );

        case 'time':
          return (
            <div>
              <input
                type="time"
                className={`${baseInputClass} ${error ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                value={value}
                onChange={(e) => handleInputChange(question.id, getQuestionTitle(question), e.target.value)}
                onBlur={(e) => handleInputBlur(question.id, e.target.value, question.required)}
              />
              {error && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <Icon name="AlertCircle" size={14} className="mr-1" />
                  {error}
                </p>
              )}
            </div>
          );

        case 'email':
          return (
            <div>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                className={`${baseInputClass} ${error ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                value={value}
                onChange={(e) => handleInputChange(question.id, getQuestionTitle(question), e.target.value)}
                onBlur={(e) => handleInputBlur(question.id, e.target.value, question.required)}
              />
              {error && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <Icon name="AlertCircle" size={14} className="mr-1" />
                  {error}
                </p>
              )}
            </div>
          );

        case 'file':
          const getFileTypesDescription = (acceptString) => {
            if (!acceptString) return 'Todos los tipos de archivo';

            const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
            const documentExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.csv', '.txt', '.rtf'];

            const acceptArray = acceptString.split(',');

            const hasImages = acceptArray.some(ext => imageExtensions.includes(ext));
            const hasDocuments = acceptArray.some(ext => documentExtensions.includes(ext));

            if (hasImages && hasDocuments) {
              return 'Imágenes y Documentos';
            } else if (hasImages) {
              return 'Imágenes (PNG, JPG, GIF, etc.)';
            } else if (hasDocuments) {
              return 'Documentos (PDF, Word, Excel, PowerPoint, etc.)';
            } else {
              return `Formatos: ${acceptString}`;
            }
          };

          const fileTypesDescription = getFileTypesDescription(question.accept);

          return (
            <div>
              <input
                type="file"
                className={`${baseInputClass} ${error ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                multiple={question.multiple || false}
                accept={question.accept || ''}
                onChange={(e) => handleFileChange(question.id, getQuestionTitle(question), e.target.files)}
              />
              <div className="mt-2 space-y-1">
                {question.accept && (
                  <p className="text-xs text-gray-500">
                    {fileTypesDescription}
                  </p>
                )}
                {question.multiple && (
                  <p className="text-xs text-gray-500">
                    Se permiten múltiples archivos
                  </p>
                )}
                {question.maxSize && (
                  <p className="text-xs text-gray-500">
                    Tamaño máximo: {question.maxSize} MB
                  </p>
                )}
                {value instanceof FileList && value.length > 0 && (
                  <p className="text-xs text-green-600">
                    {value.length} archivo(s) seleccionado(s)
                  </p>
                )}
              </div>
              {error && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <Icon name="AlertCircle" size={14} className="mr-1" />
                  {error}
                </p>
              )}
            </div>
          );

        case 'single_choice':
          return (
            <div className="space-y-3">
              {(question?.options || []).map((option, idx) => {
                const optionText = typeof option === 'object' ? option.text : option;
                const optionValue = typeof option === 'object' ? option.text : option;
                const isChecked = value === optionValue;
                const hasSubform = typeof option === 'object' && option.hasSubform && option.subformQuestions && option.subformQuestions.length > 0;
                const shouldShowSubsection = hasSubform && isChecked;

                return (
                  <div key={idx} className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name={questionPath}
                        value={optionValue}
                        checked={isChecked}
                        onChange={(e) => handleRadioChange(question.id, getQuestionTitle(question), e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-base text-black">{optionText}</span>
                    </label>
                    {shouldShowSubsection && (
                      <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
                        {option.subformQuestions.map((subQuestion, subIndex) =>
                          renderQuestion(subQuestion, subIndex, false, `${questionPath}-${optionValue}`)
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {error && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <Icon name="AlertCircle" size={14} className="mr-1" />
                  {error}
                </p>
              )}
            </div>
          );

        case 'multiple_choice':
          return (
            <div className="space-y-3">
              {(question?.options || []).map((option, idx) => {
                const optionText = typeof option === 'object' ? option.text : option;
                const isChecked = Array.isArray(value) && value.includes(optionText);
                const hasSubform = typeof option === 'object' && option.hasSubform && option.subformQuestions && option.subformQuestions.length > 0;
                const shouldShowSubsection = hasSubform && isChecked;

                return (
                  <div key={idx} className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(question.id, getQuestionTitle(question), optionText)}
                        className="h-4 w-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2"
                      />
                      <span className="text-base text-black">{optionText}</span>
                    </label>
                    {shouldShowSubsection && (
                      <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
                        {option.subformQuestions.map((subQuestion, subIndex) =>
                          renderQuestion(subQuestion, subIndex, false, `${questionPath}-${optionText}`)
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {error && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <Icon name="AlertCircle" size={14} className="mr-1" />
                  {error}
                </p>
              )}
            </div>
          );

        default:
          return (
            <div className="text-center py-4 text-gray-500">
              Tipo de pregunta no soportado
            </div>
          );
      }
    };

    return (
      <div key={question?.id} className="space-y-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="mb-4">
            <div className="flex items-start space-x-3">
              {showNumber && (
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{
                    backgroundColor: formData?.primaryColor || '#3B82F6',
                  }}
                >
                  {index + 1}
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-black mb-1">
                  {questionTitle}
                  {question?.required && (
                    <span className="text-red-600 ml-1">*</span>
                  )}
                </h3>

                {question?.description && (
                  <p className="text-gray-600 text-base">
                    {question?.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className={showNumber ? "ml-11" : ""}>
            {renderInput()}
          </div>
        </div>
      </div>
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      const answersWithTitles = mapAnswersToTitles(formData?.questions || [], answers);

      const adjuntos = [];
      const processedAnswers = { ...answersWithTitles };

      const processFiles = async (questions) => {
        const processQuestion = async (question) => {
          console.log('Procesando pregunta:', question);

          if (question.type === 'file' && answers[question.id] instanceof FileList) {
            console.log('Encontré archivos en pregunta:', question.id, answers[question.id]);
            const fileList = answers[question.id];
            const questionTitle = getQuestionTitle(question);

            processedAnswers[questionTitle] = Array.from(fileList).map(file => file.name);

            const filePromises = Array.from(fileList).map(async (file) => {
              try {
                console.log('Procesando archivo:', file.name, file.size);
                const fileData = await fileToBase64(file);
                return {
                  pregunta: questionTitle,
                  fileName: file.name,
                  fileData: fileData,
                  mimeType: file.type,
                  size: file.size,
                  uploadedAt: new Date().toISOString()
                };
              } catch (error) {
                console.error('Error procesando archivo:', error);
                return null;
              }
            });

            const processedFiles = await Promise.all(filePromises);
            adjuntos.push(...processedFiles.filter(file => file !== null));
          }

          if (question?.options) {
            for (const option of question.options) {
              if (typeof option === 'object' && option.hasSubform && option.subformQuestions) {
                await processFiles(option.subformQuestions);
              }
            }
          }
        };

        for (const question of questions) {
          await processQuestion(question);
        }
      };

      try {
        await processFiles(formData?.questions || []);
      } catch (error) {
        console.error('Error en processFiles:', error);
      }

      console.log('Total de adjuntos procesados:', adjuntos.length);
      console.log('Adjuntos:', adjuntos);

      console.log('Total de adjuntos procesados:', adjuntos.length);
      console.log('Adjuntos:', adjuntos);

      const cleanAnswers = Object.fromEntries(
        Object.entries(processedAnswers).filter(([_, value]) =>
          value !== '' &&
          value !== null &&
          value !== undefined &&
          !(Array.isArray(value) && value.length === 0)
        )
      );

      const payload = {
        formId: formData?.id,
        formTitle: formData?.title,
        responses: cleanAnswers,
        adjuntos: adjuntos,
        mail: respaldo,
        submittedAt: new Date().toISOString(),
        user: user
      };

      console.log('Payload a enviar:', payload);

      const res = await fetch(`https://accionaapi.vercel.app/api/respuestas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error al enviar respuestas');

      const data = await res.json();
      console.log('Respuesta del servidor:', data);
      alert('Respuestas enviadas con éxito');

      setAnswers({});
      setRespaldo("");
      setErrors({});
      setTouched({});
    } catch (err) {
      console.error(err);
      alert('No se pudieron enviar las respuestas');
    }
  };

  if (!formData?.title && formData?.questions?.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="Eye" size={24} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Formulario no disponible
        </h3>
        <p className="text-gray-600">
          Parece que este formulario no existe o fue eliminado, pruebe a responder algun otro
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-1">
        <div
          className="rounded-lg p-6 min-h-96"
          style={{
            backgroundColor: formData?.secondaryColor || '#F3F4F6',
          }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">
              {formData?.title || 'Título del Formulario'}
            </h1>

            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 mb-4">
              {formData?.category && (
                <div className="flex items-center space-x-1">
                  <Icon name="Tag" size={14} />
                  <span className="capitalize">{formData?.category}</span>
                </div>
              )}

              {formData?.responseTime && (
                <div className="flex items-center space-x-1">
                  <Icon name="Clock" size={14} />
                  <span>{formData?.responseTime} minutos</span>
                </div>
              )}

              {formData?.author && (
                <div className="flex items-center space-x-1">
                  <Icon name="User" size={14} />
                  <span>{formData?.author}</span>
                </div>
              )}
            </div>

            {formData?.questions?.length > 0 && (
              <p className="text-gray-600">
                {formData?.questions?.length} pregunta
                {formData?.questions?.length !== 1 ? 's' : ''} •{' '}
                {formData?.questions?.filter((q) => q?.required)?.length} obligatoria
                {formData?.questions?.filter((q) => q?.required)?.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="space-y-6">
            {formData?.questions?.map((question, index) =>
              renderQuestion(question, index, true)
            )}

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="mb-4">
                <div className="flex items-start space-x-3">
                  {formData?.questions?.length && (
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                      style={{
                        backgroundColor: formData?.primaryColor || '#3B82F6',
                      }}
                    >
                      {formData?.questions?.length + 1}
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black mb-1">
                      Respaldo de información
                    </h3>

                    <p className="text-gray-600 text-base">
                      mail de envio de respaldo de respuestas (opcional)
                    </p>
                  </div>
                </div>
              </div>

              <div className={"ml-11"}>
                <input
                  type="email"
                  placeholder="Escribe tu mail aquí (opcional)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={respaldo}
                  onChange={(e) => setRespaldo(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  * Campos obligatorios
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    className="px-6 py-3 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setAnswers({});
                      setRespaldo("");
                      setErrors({});
                      setTouched({});
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleSubmit}
                    style={{
                      backgroundColor: formData?.primaryColor || '#3B82F6',
                    }}
                    className="px-6 py-3 rounded-md font-medium text-white hover:opacity-90 transition-opacity"
                  >
                    Enviar Formulario
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormPreview;