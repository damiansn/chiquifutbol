const matches = [];
        const seenTexts = new Set();

        // Buscamos contenedores específicos de partidos o filas de la tabla de calendario
        // Ajustá según la estructura visual real que inspecciones en Promiedos para /calendario/
        $('tr, .fila-partido, .partido-calendario').each((_, el) => {
            const rowText = $(el).text().replace(/\s+/g, ' ').trim();
            
            // Verificamos que contenga al equipo y que tenga una longitud coherente para un partido
            if (
                rowText.toLowerCase().includes(teamName.toLowerCase()) && 
                rowText.length > 5 && 
                !seenTexts.has(rowText)
            ) {
                seenTexts.add(rowText);
                matches.push({
                    rawText: rowText,
                });
            }
        });