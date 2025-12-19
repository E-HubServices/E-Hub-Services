import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Service } from "@/data/services";
import { Clock, IndianRupee, ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  service: Service;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  return (
    <Card className="group relative overflow-hidden border-slate-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col h-full bg-white rounded-2xl">
      {service.popular && (
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-primary text-white border-0 font-black uppercase text-[10px] tracking-widest px-3 shadow-lg">
            Popular
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-sm">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <Badge variant="outline" className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-slate-200 px-2 py-0">
              {service.code}
            </Badge>
            <CardTitle className="font-heading text-xl leading-tight text-slate-900 font-bold group-hover:text-primary transition-colors">
              {service.name}
            </CardTitle>
          </div>
        </div>
        <p className="text-sm text-slate-600 mt-4 line-clamp-2 md:line-clamp-3 font-medium leading-relaxed">
          {service.description}
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col pt-0">
        {/* Pricing & Duration */}
        <div className="flex items-center justify-between mb-5 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-1 text-slate-900">
            <IndianRupee className="h-5 w-5 text-green-700 font-black" />
            <span className="text-3xl font-black font-heading tracking-tighter">{service.price}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-900 text-xs font-black uppercase tracking-wider">
            <Clock className="h-4 w-4 text-primary" />
            {service.processingTime}
          </div>
        </div>

        {/* Department Info */}
        <div className="bg-slate-50 rounded-xl p-3 mb-5 border border-slate-100">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Government Entity</p>
          <p className="text-sm text-slate-900 font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            {service.department}
          </p>
        </div>

        {/* Required Documents Preview */}
        <div className="mb-6 flex-1">
          <p className="text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            Core Prerequisites:
          </p>
          <ul className="space-y-2">
            {service.requiredDocuments.slice(0, 3).map((doc, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-700 font-bold leading-tight">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                {doc}
              </li>
            ))}
            {service.requiredDocuments.length > 3 && (
              <li className="text-[10px] text-primary font-black uppercase tracking-wider pl-5">
                +{service.requiredDocuments.length - 3} additional documents required
              </li>
            )}
          </ul>
        </div>

        {/* CTA Button */}
        <Link to={`/service/${service.id}`} className="mt-auto">
          <Button className="w-full h-12 gap-3 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
            Secure Application
            <ArrowRight className="h-4 w-4 text-primary" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
