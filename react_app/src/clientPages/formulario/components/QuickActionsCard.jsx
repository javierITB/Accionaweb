import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon.jsx';
import { apiFetch, API_BASE_URL } from '../../../utils/api';

const FormPreview = ({ formData }) => {
  const [answers, setAnswers] = useState({});
  const [respaldo, setRespaldo] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [fileErrors, setFileErrors] = useState({});
  const [user, setUser] = useState({
    uid: '',
    nombre: '',
    empresa: '',
    token: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFilesByQuestion, setSelectedFilesByQuestion] = useState({});

  const usuario = sessionStorage.getItem("user");
  const cargo = sessionStorage.getItem("cargo");
  const mail = sessionStorage.getItem("email");
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/auth/${mail}`);
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

  const getFileIcon = (mimeType) => {
    if (mimeType.includes('pdf')) return 'FileText';
    if (mimeType.includes('image')) return 'Image';
    if (mimeType.includes('video')) return 'Video';
    if (mimeType.includes('audio')) return 'Music';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'File';
    return 'File';
  };

  const formatFileType = (mimeType) => {
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'JPEG';
    if (mimeType.includes('png')) return 'PNG';
    if (mimeType.includes('word')) return 'Word';
    return mimeType.split('/')[1]?.toUpperCase() || 'Archivo';
  };

  const validateFiles = (files, question) => {
    const errors = [];

    if (!files || files.length === 0) {
      return errors;
    }

    if (!question.multiple && files.length > 1) {
      errors.push('Solo se permite un archivo');
      return errors;
    }

    const allowedTypes = question.accept || '.pdf,application/pdf';
    const maxSizeMB = question.maxSize ? parseInt(question.maxSize) : 0.5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    const allowedTypesArray = allowedTypes.split(',')
      .map(type => type.trim().toLowerCase())
      .filter(type => type.length > 0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const isTypeValid = allowedTypesArray.some(allowedType => {
        if (allowedType.startsWith('.')) {
          const fileExtension = '.' + file.name.toLowerCase().split('.').pop();
          return fileExtension === allowedType;
        }
        else if (allowedType.includes('/')) {
          return file.type.toLowerCase() === allowedType;
        }
        else if (allowedType.endsWith('/*')) {
          const category = allowedType.split('/*')[0];
          return file.type.toLowerCase().startsWith(category + '/');
        }
        return false;
      });

      if (!isTypeValid) {
        const allowedTypesText = allowedTypesArray.map(type => {
          if (type.startsWith('.')) return type;
          if (type === 'image/*') return 'imágenes';
          if (type === 'application/pdf') return 'PDF';
          if (type === 'video/*') return 'videos';
          return type;
        }).join(', ');

        errors.push(`Tipo de archivo no permitido: ${file.name}. Formatos permitidos: ${allowedTypesText}`);
        continue;
      }

      if (file.size > maxSizeBytes) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        errors.push(`Archivo demasiado grande: ${file.name} (${fileSizeMB} MB). Tamaño máximo: ${maxSizeMB} MB`);
      }
    }

    return errors;
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
    const question = findQuestionById(formData?.questions || [], questionId);

    if (question && question.type === 'file') {
      const fileArray = Array.from(files);

      const existingFiles = selectedFilesByQuestion[questionId] || [];

      const newTotalFiles = existingFiles.length + fileArray.length;

      // Usar question.maxFiles dinámicamente
      const maxAllowedFiles = question.multiple ? (question.maxFiles || 4) : 1;

      if (!question.multiple && newTotalFiles > 1) {
        setFileErrors(prev => ({
          ...prev,
          [questionId]: ['Solo se permite un archivo']
        }));
        return;
      }

      if (question.multiple && newTotalFiles > maxAllowedFiles) {
        setFileErrors(prev => ({
          ...prev,
          [questionId]: [`Máximo ${maxAllowedFiles} archivos permitidos`]
        }));
        return;
      }

      const validationErrors = validateFiles(fileArray, question);

      if (validationErrors.length > 0) {
        setFileErrors(prev => ({
          ...prev,
          [questionId]: validationErrors
        }));
        return;
      } else {
        setFileErrors(prev => ({
          ...prev,
          [questionId]: []
        }));
      }

      const updatedFiles = [...existingFiles, ...fileArray];
      setSelectedFilesByQuestion(prev => ({
        ...prev,
        [questionId]: updatedFiles
      }));

      const dataTransfer = new DataTransfer();
      updatedFiles.forEach(file => dataTransfer.items.add(file));

      setAnswers(prev => ({
        ...prev,
        [questionId]: dataTransfer.files
      }));

      if (errors[questionId]) {
        setErrors(prev => ({
          ...prev,
          [questionId]: ''
        }));
      }
    }
  };

  const removeFile = (questionId, fileIndex) => {
    const updatedFiles = [...(selectedFilesByQuestion[questionId] || [])];
    updatedFiles.splice(fileIndex, 1);

    setSelectedFilesByQuestion(prev => ({
      ...prev,
      [questionId]: updatedFiles
    }));

    const dataTransfer = new DataTransfer();
    updatedFiles.forEach(file => dataTransfer.items.add(file));

    setAnswers(prev => ({
      ...prev,
      [questionId]: updatedFiles.length > 0 ? dataTransfer.files : null
    }));

    if (updatedFiles.length === 0 && errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: ''
      }));
    }
  };

  const triggerFileInput = (questionId) => {
    const input = document.getElementById(`file-input-${questionId}`);
    if (input) {
      input.click();
    }
  };

  const findQuestionById = (questions, id) => {
    for (const question of questions) {
      if (question.id === id) return question;

      if (question.options) {
        for (const option of question.options) {
          if (typeof option === 'object' && option.subformQuestions) {
            const found = findQuestionById(option.subformQuestions, id);
            if (found) return found;
          }
        }
      }
    }
    return null;
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

      if (question.type === 'file' && answers[question.id] instanceof FileList) {
        const fileErrors = validateFiles(answers[question.id], question);
        if (fileErrors.length > 0) {
          errors[question.id] = 'Error en los archivos seleccionados';
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

  const mapAnswersToTitles = (questions, answers, mappedAnswers = {}, contexto = {}) => {
    const processedQuestions = new Set();

    const processQuestionTree = (questionList, level = 0, currentContext = '') => {
      questionList.forEach((question, index) => {
        const questionKey = `${level}-${index}-${question.id}`;
        if (processedQuestions.has(questionKey)) return;
        processedQuestions.add(questionKey);

        const questionTitle = getQuestionTitle(question);
        const answer = answers[question.id];

        const hasValidAnswer = answer !== undefined && answer !== null &&
          answer !== '' && !(Array.isArray(answer) && answer.length === 0);

        if (hasValidAnswer) {
          if (question.type === 'file' && answer instanceof FileList) {
            mappedAnswers[questionTitle] = Array.from(answer).map(file => file.name).join(', ');
          } else {
            mappedAnswers[questionTitle] = answer;
          }

          if (currentContext) {
            if (!contexto.camposContextuales) contexto.camposContextuales = {};
            if (!contexto.camposContextuales[currentContext]) {
              contexto.camposContextuales[currentContext] = {};
            }
            contexto.camposContextuales[currentContext][questionTitle] = answer;
          }
        }

        (question?.options || []).forEach((option, optionIndex) => {
          if (typeof option === 'object' && option.hasSubform && option.subformQuestions) {
            const optionText = option.text || 'Opción';
            const isOptionSelected =
              question.type === 'single_choice' ? answers[question.id] === optionText :
                question.type === 'multiple_choice' ? Array.isArray(answers[question.id]) && answers[question.id].includes(optionText) : false;

            if (isOptionSelected) {
              const subContext = currentContext ? `${currentContext}|${optionText}` : optionText;
              processQuestionTree(option.subformQuestions, level + 1, subContext);
            }
          }
        });
      });
    };

    processQuestionTree(questions);

    return {
      ...mappedAnswers,
      _contexto: contexto.camposContextuales || {}
    };
  };

  const validateForm = () => {
    let newErrors = {};

    newErrors = validateQuestions(formData?.questions || [], answers);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getFileTypesDescription = (question) => {
    if (!question.accept) return 'PDF solamente (500KB máximo)';

    const allowedTypes = question.accept.split(',')
      .map(type => type.trim())
      .filter(type => type.length > 0);

    // Primero convertir todo a formatos legibles
    const readableTypes = allowedTypes.map(type => {
      if (type.startsWith('.')) {
        const ext = type.substring(1).toUpperCase();
        return ext === 'PDF' ? 'PDF' : `.${ext}`;
      }
      if (type === 'application/pdf') return 'PDF';
      if (type === 'image/*') return 'Imágenes';
      if (type === 'video/*') return 'Videos';
      if (type === 'audio/*') return 'Audio';
      if (type === 'application/msword') return 'DOC';
      if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
      if (type.includes('image/')) return type.split('/')[1].toUpperCase();
      return type;
    });

    // Eliminar duplicados manteniendo el orden
    const uniqueTypes = [...new Set(readableTypes)];

    const maxSize = question.maxSize ? `${question.maxSize} MB` : '0.5 MB';

    return `${uniqueTypes.join(', ')} (${maxSize} máximo)`;
  };

  const renderFileInput = (question, fileErrorList, error) => {
    const fileTypesDescription = getFileTypesDescription(question);
    const hasFileErrors = fileErrorList.length > 0;
    const selectedFiles = selectedFilesByQuestion[question.id] || [];
    const isMultipleAllowed = question.multiple || false;
    const maxFiles = isMultipleAllowed ? (question.maxFiles || 4) : 1;

    return (
      <div className="space-y-3">
        <input
          id={`file-input-${question.id}`}
          type="file"
          className="hidden"
          multiple={false}
          accept={question.accept || '.pdf,application/pdf'}
          onChange={(e) => {
            handleFileChange(question.id, getQuestionTitle(question), e.target.files);
            e.target.value = '';
          }}
        />

        <button
          type="button"
          onClick={() => triggerFileInput(question.id)}
          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center justify-center"
          disabled={selectedFiles.length >= maxFiles}
          title="Seleccionar archivo"
        >
          <div className="flex items-center justify-center space-x-2">
            <Icon name="Upload" size={20} className="text-gray-400" />
            <span className="text-gray-700 font-medium">
              {selectedFiles.length >= maxFiles ? 'Límite alcanzado' : 'Seleccionar archivo'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Haz clic para seleccionar un archivo
          </p>
        </button>

        <div className="space-y-1">
          <p className="text-xs text-gray-500">
            <strong>Formatos permitidos:</strong> {fileTypesDescription}
          </p>
          <p className="text-xs text-gray-500">
            <strong>Límite:</strong> {isMultipleAllowed ? `Máximo ${maxFiles} archivos, uno por uno` : '1 archivo solamente'}
          </p>
          <p className="text-xs text-gray-500">
            <strong>Seleccionados:</strong> {selectedFiles.length}/{maxFiles} archivos
          </p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Archivos seleccionados:</p>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Icon
                      name={getFileIcon(file.type)}
                      size={16}
                      className="text-gray-400 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB • {formatFileType(file.type)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(question.id, index)}
                    className="ml-2 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                    title="Eliminar archivo"
                  >
                    <Icon name="X" size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasFileErrors && (
          <div className="space-y-1">
            {fileErrorList.map((errorMsg, idx) => (
              <p key={idx} className="text-red-600 text-sm flex items-center">
                <Icon name="AlertCircle" size={14} className="mr-1 flex-shrink-0" />
                {errorMsg}
              </p>
            ))}
          </div>
        )}

        {error && !hasFileErrors && (
          <p className="text-red-600 text-sm mt-1 flex items-center">
            <Icon name="AlertCircle" size={14} className="mr-1" />
            {error}
          </p>
        )}
      </div>
    );
  };

  const renderQuestion = (question, index, showNumber = true, parentPath = '') => {
    const questionPath = parentPath ? `${parentPath}.${question.id}` : question.id;
    const questionTitle = question.title || `Pregunta ${index + 1}`;
    const baseInputClass = 'w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md bg-white text-black text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';
    const value = answers[question.id] || '';
    const error = errors[question.id];
    const isTouched = touched[question.id];
    const fileErrorList = fileErrors[question.id] || [];

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
                onWheel={(e) => {
                  // Bloquea el scroll del mouse en el input numérico
                  e.target.blur();
                }}
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

        case 'rut':
          const formatRut = (rut) => {
            if (!rut) return '';
            let actual = rut.replace(/[^0-9kK]/g, '').toUpperCase();
            if (actual.length <= 1) return actual;

            let cuerpo = actual.substring(0, actual.length - 1);
            let dv = actual.substring(actual.length - 1);

            let cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

            return `${cuerpoFormateado}-${dv}`;
          };

          return (
            <div>
              <input
                type="text"
                placeholder="12.345.678-K"
                className={`${baseInputClass} ${error ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                value={value}
                maxLength={12} // 9 digits + 2 dots + 1 hyphen = 12 chars max (XX.XXX.XXX-X)
                onChange={(e) => {
                  const formatted = formatRut(e.target.value);
                  // Asegurar límite de caracteres reales del rut (8 o 9 dígitos)
                  // O simplemente dejar que el usuario escriba y el format se encargue
                  if (formatted.length <= 12) {
                    handleInputChange(question.id, getQuestionTitle(question), formatted);
                  }
                }}
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
          return renderFileInput(question, fileErrorList, error);

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
                    <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                      <input
                        type="radio"
                        name={questionPath}
                        value={optionValue}
                        checked={isChecked}
                        onChange={(e) => handleRadioChange(question.id, getQuestionTitle(question), e.target.value)}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-base text-black flex-1">{optionText}</span>
                    </label>
                    {shouldShowSubsection && (
                      <div className="ml-4 sm:ml-6 space-y-4 border-l-2 border-gray-200 pl-3 sm:pl-4">
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
                    <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(question.id, getQuestionTitle(question), optionText)}
                        className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2"
                      />
                      <span className="text-base text-black flex-1">{optionText}</span>
                    </label>
                    {shouldShowSubsection && (
                      <div className="ml-4 sm:ml-6 space-y-4 border-l-2 border-gray-200 pl-3 sm:pl-4">
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
      }
    };

    return (
      <div key={question?.id} className="space-y-4">
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
          <div className="mb-4">
            <div className="flex items-start space-x-3">
              {showNumber && (
                <div
                  className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm"
                  style={{
                    backgroundColor: formData?.primaryColor || '#3B82F6',
                  }}
                >
                  {index + 1}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-black mb-1 break-words">
                  {questionTitle}
                  {question?.required && (
                    <span className="text-red-600 ml-1">*</span>
                  )}
                </h3>

                {question?.description && (
                  <p className="text-gray-600 text-sm sm:text-base break-words">
                    {question?.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className={showNumber ? "ml-0 sm:ml-11" : ""}>
            {renderInput()}
          </div>
        </div>
      </div>
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert('Por favor completa todos los campos obligatorios y corrige los errores en los archivos');
      return;
    }

    if (isSubmitting) {
      alert('El formulario ya se está enviando, por favor espera...');
      return;
    }

    setIsSubmitting(true);

    try {
      const answersWithTitles = mapAnswersToTitles(formData?.questions || [], answers);
      const processedAnswers = { ...answersWithTitles };

      const cleanAnswers = Object.fromEntries(
        Object.entries(processedAnswers).filter(([_, value]) =>
          value !== '' &&
          value !== null &&
          value !== undefined &&
          !(Array.isArray(value) && value.length === 0)
        )
      );

      const payloadBase = {
        formId: formData?.id,
        formTitle: formData?.title,
        responses: cleanAnswers,
        mail: respaldo,
        submittedAt: new Date().toISOString(),
        user: user,
        adjuntos: []
      };

      console.log('Enviando respuestas base... User Payload:', user);
      const res = await apiFetch(`${API_BASE_URL}/respuestas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBase),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error al enviar respuestas: ${errorText}`);
      }

      const data = await res.json();
      console.log('Respuestas base guardadas:', data);

      const responseId = data._id;

      const todosLosArchivos = [];

      const processFiles = async (questions) => {
        const processQuestion = async (question) => {
          if (question.type === 'file' && answers[question.id] instanceof FileList) {
            const fileList = answers[question.id];
            const questionTitle = getQuestionTitle(question);

            const filePromises = Array.from(fileList).map(async (file, fileIndex) => {
              try {
                const fileData = await fileToBase64(file);

                return {
                  adjunto: {
                    pregunta: questionTitle,
                    fileName: file.name,
                    fileData: fileData,
                    mimeType: file.type,
                    size: file.size
                  },
                  index: fileIndex,
                  total: fileList.length
                };
              } catch (error) {
                console.error('Error procesando archivo:', error);
                return null;
              }
            });

            const processedFiles = await Promise.all(filePromises);
            const validFiles = processedFiles.filter(file => file !== null);
            todosLosArchivos.push(...validFiles);
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

      if (Object.values(answers).some(answer => answer instanceof FileList)) {
        console.log('Procesando archivos...');
        await processFiles(formData?.questions || []);

        if (todosLosArchivos.length > 0) {
          console.log(`Enviando ${todosLosArchivos.length} archivos...`);

          for (let i = 0; i < todosLosArchivos.length; i++) {
            const archivoData = todosLosArchivos[i];

            try {
              console.log(`Enviando archivo ${i + 1} de ${todosLosArchivos.length}:`, archivoData.adjunto.fileName);

              const uploadRes = await apiFetch(`${API_BASE_URL}/respuestas/${responseId}/adjuntos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(archivoData),
              });

              if (!uploadRes.ok) {
                const errorText = await uploadRes.text();
                console.warn(`Error subiendo archivo ${i + 1}:`, errorText);
              } else {
                const uploadData = await uploadRes.json();
                console.log(`Archivo ${i + 1} subido exitosamente:`, uploadData.message);
              }
            } catch (chunkError) {
              console.error(`Error en archivo ${i + 1}:`, chunkError);
            }

            await new Promise(resolve => setTimeout(resolve, 100));
          }

          console.log(`Total archivos procesados: ${todosLosArchivos.length}`);
        }
      }

      alert('Formulario enviado con éxito');

      setAnswers({});
      setRespaldo("");
      setErrors({});
      setTouched({});
      setFileErrors({});
      setSelectedFilesByQuestion({});

    } catch (err) {
      console.error('Error:', err);
      alert(`No se pudieron enviar las respuestas: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setAnswers({});
    setRespaldo("");
    setErrors({});
    setTouched({});
    setFileErrors({});
    setSelectedFilesByQuestion({});
  };

  if (!formData?.title && formData?.questions?.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="Eye" size={20} className="text-gray-400 sm:w-6 sm:h-6" />
        </div>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
          Formulario no disponible
        </h3>
        <p className="text-gray-600 text-sm sm:text-base">
          Parece que este formulario no existe o fue eliminado, pruebe a responder algun otro
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-1">
        <div
          className="rounded-lg p-4 sm:p-6 min-h-96"
          style={{
            backgroundColor: formData?.secondaryColor || '#F3F4F6',
          }}
        >
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black mb-2 break-words">
              {formData?.title || 'Título del Formulario'}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              {formData?.category && (
                <div className="flex items-center justify-center sm:justify-start space-x-1">
                  <Icon name="Tag" size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span className="capitalize">{formData?.category}</span>
                </div>
              )}

              {formData?.responseTime && (
                <div className="flex items-center justify-center sm:justify-start space-x-1">
                  <Icon name="Clock" size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span>{formData?.responseTime} minutos</span>
                </div>
              )}

              {formData?.author && (
                <div className="flex items-center justify-center sm:justify-start space-x-1">
                  <Icon name="User" size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span>{formData?.author}</span>
                </div>
              )}
            </div>

            {formData?.questions?.length > 0 && (
              <p className="text-gray-600 text-sm sm:text-base">
                {formData?.questions?.length} pregunta
                {formData?.questions?.length !== 1 ? 's' : ''} •{' '}
                {formData?.questions?.filter((q) => q?.required)?.length} obligatoria
                {formData?.questions?.filter((q) => q?.required)?.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="space-y-4 sm:space-y-6">
            {formData?.questions?.map((question, index) =>
              renderQuestion(question, index, true)
            )}

            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
              <div className="mb-4">
                <div className="flex items-start space-x-3">
                  {formData?.questions?.length && (
                    <div
                      className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm"
                      style={{
                        backgroundColor: formData?.primaryColor || '#3B82F6',
                      }}
                    >
                      {formData?.questions?.length + 1}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-black mb-1">
                      Respaldo de información
                    </h3>

                    <p className="text-gray-600 text-sm sm:text-base">
                      mail de envio de respaldo de respuestas (opcional)
                    </p>
                  </div>
                </div>
              </div>

              <div className={"ml-0 sm:ml-11"}>
                <input
                  type="email"
                  placeholder="Escribe tu mail aquí (opcional)..."
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md bg-white text-black text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={respaldo}
                  onChange={(e) => setRespaldo(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                  * Campos obligatorios
                </div>

                <div className="flex flex-col xs:flex-row items-stretch xs:items-center space-y-2 xs:space-y-0 xs:space-x-3">
                  <button
                    className="px-4 sm:px-6 py-3 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    title="Cancelar y limpiar el formulario"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleSubmit}
                    style={{
                      backgroundColor: formData?.primaryColor || '#3B82F6',
                    }}
                    className="px-4 sm:px-6 py-3 rounded-md font-medium text-white hover:opacity-90 transition-opacity text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                    title="Enviar el formulario con las respuestas proporcionadas"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Formulario'}
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