'use client';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from "@/hooks/use-toast";

interface ChartDownloaderProps {
  chartRef: React.RefObject<HTMLDivElement>;
  fileName?: string;
}

export default function ChartDownloader({ chartRef, fileName = 'chart' }: ChartDownloaderProps) {
  const downloadChart = async () => {
    if (!chartRef.current) return;

    try {
      const canvas = await html2canvas(chartRef.current, {
        allowTaint: true,
        useCORS: true,
        backgroundColor: null, 
        scale: 2, 
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${fileName}.jpeg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
          title: "Download Started",
          description: `Your chart (${fileName}.jpeg) is being downloaded.`,
      })

    } catch (error) {
      console.error('Error downloading chart:', error);
      toast({
          variant: 'destructive',
          title: "Download Failed",
          description: "Could not generate an image of the chart.",
      })
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={downloadChart} aria-label="Download chart">
      <Download className="h-4 w-4" />
    </Button>
  );
}
