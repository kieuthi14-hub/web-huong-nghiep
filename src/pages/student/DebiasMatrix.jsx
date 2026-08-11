import React from 'react'
import { Brain } from 'lucide-react'

const DebiasMatrix = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-reveal">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2.5 bg-brand-50 border border-brand-100 rounded-sm text-brand-600">
          <Brain className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Bảng Ma trận Phản tư Chọn nghề
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Công cụ nhận diện và loại bỏ định kiến tư duy (Debias) trong quá trình ra quyết định định hướng nghề nghiệp.
          </p>
        </div>
      </div>

      {/* Nội dung trang chuẩn bị phát triển */}
      <div className="bg-white border border-slate-200 p-12 rounded-sm text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto border border-brand-100">
          <Brain className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          Bảng Ma trận Phản tư Chọn nghề
        </h3>
        <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed font-medium">
          Trang đang được sẵn sàng để xây dựng các ma trận phản tư nhận diện định kiến thu nhập, áp lực gia đình, xu hướng đám đông và hào quang nghề nghiệp.
        </p>
      </div>
    </div>
  )
}

export default DebiasMatrix
