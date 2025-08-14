// src/utils/pdfGenerator.js
export const generateClassPdf = (studentName, completedClass, stationsInClass, checkInsForClass) => {
    if (!window.jspdf) {
        console.error("PDF generation library is not loaded yet. Please try again in a moment.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text(`Completion Report for ${completedClass.name}`, 105, 20, null, null, "center");

    doc.setFontSize(12);
    doc.text(`Student: ${studentName}`, 14, 40);
    doc.text(`Completion Date: ${new Date().toLocaleDateString()}`, 14, 48);

    let lastY = 55;

    stationsInClass.forEach(station => {
        doc.setFontSize(14);
        doc.text(`Station: ${station.name}`, 14, lastY + 10);

        const checkInForStation = checkInsForClass.find(c => c.stationId === station.id);
        const completedSkills = checkInForStation?.completedSkills || {};

        const tableColumn = ["#", "Skill / Task", "Status", "Signed Off By", "Date"];
        const tableRows = [];

        station.skills.forEach((skill, index) => {
            const signOffData = completedSkills[skill.id];
            let skillText = skill.text;
            
            if ((signOffData?.status === 'fail' || signOffData?.status === 'remediate') && signOffData.documentation) {
                const docLabel = signOffData.status === 'fail' ? 'Failure Note:' : 'Remediation Note:';
                skillText += `\n${docLabel} ${signOffData.documentation}`;
            }

            let statusText = "N/A";
            if (signOffData) {
                switch(signOffData.status) {
                    case 'pass': statusText = "Pass"; break;
                    case 'fail': statusText = "Fail"; break;
                    case 'remediate': statusText = "Pass w/ Remediation"; break;
                    default: statusText = signOffData.status.toUpperCase();
                }
            }

            const skillData = [
                index + 1,
                skillText,
                statusText,
                signOffData ? signOffData.signature : "N/A",
                signOffData ? new Date(signOffData.timestamp.seconds * 1000).toLocaleDateString() : "N/A"
            ];
            tableRows.push(skillData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: lastY + 15,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] }
        });
        lastY = doc.autoTable.previous.finalY;
    });

    doc.save(`${studentName}_${completedClass.name}_Report.pdf`);
};
