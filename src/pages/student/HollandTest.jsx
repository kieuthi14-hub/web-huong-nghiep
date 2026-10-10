import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import HollandChart from '../../components/common/HollandChart'
import StepProgressHeader from '../../components/common/StepProgressHeader'
import { 
  ClipboardList, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  Award, 
  GraduationCap, 
  Lightbulb, 
  Sparkles, 
  Anchor, 
  HelpCircle, 
  TrendingUp, 
  Brain, 
  ShieldCheck,
  AlertCircle,
  Bot,
  Pencil,
  RotateCcw,
  Scale,
  Target,
  Search,
  Check
} from 'lucide-react'

// BỘ 30 CÂU HỎI RIASEC CHUẨN KHOA HỌC HÀNH VI (5 CÂU / NHÓM)
export const DEFAULT_HOLLAND_QUESTIONS = [
  // Realistic (R) - Kỹ thuật
  { id: 1, category: 'R', text: 'Thích lắp ráp, sửa chữa hoặc tháo rời các thiết bị điện tử, đồ gia dụng trong nhà.' },
  { id: 2, category: 'R', text: 'Thích các hoạt động thể chất ngoài trời hoặc làm việc với công cụ, máy móc cơ khí.' },
  { id: 3, category: 'R', text: 'Thích tự tay chế tạo hoặc đóng một món đồ gỗ, mô hình lắp ghép thủ công.' },
  { id: 4, category: 'R', text: 'Thích làm việc thực tế với cây cối, động vật hoặc môi trường tự nhiên.' },
  { id: 5, category: 'R', text: 'Thích vận hành, điều khiển các thiết bị kỹ thuật đòi hỏi sự khéo léo của đôi tay.' },

  // Investigative (I) - Nghiên cứu
  { id: 6, category: 'I', text: 'Thích tìm hiểu nguyên lý khoa học đằng sau các hiện tượng tự nhiên và công nghệ mới.' },
  { id: 7, category: 'I', text: 'Thích giải quyết các bài toán hóc búa, câu đố logic hoặc thử thách phân tích phức tạp.' },
  { id: 8, category: 'I', text: 'Thích đọc tài liệu khoa học, sách chuyên ngành hoặc xem các video giải thích chuyên sâu.' },
  { id: 9, category: 'I', text: 'Thích quan sát, thu thập số liệu và rút ra kết luận dựa trên bằng chứng xác thực.' },
  { id: 10, category: 'I', text: 'Thích làm các thí nghiệm hóa học, vật lý hoặc phân tích dữ liệu trên máy tính.' },

  // Artistic (A) - Nghệ thuật
  { id: 11, category: 'A', text: 'Thích sáng tạo nội dung, viết lách, làm thơ hoặc chia sẻ câu chuyện giàu cảm xúc.' },
  { id: 12, category: 'A', text: 'Thích vẽ tranh, thiết kế đồ họa, chụp ảnh nghệ thuật hoặc quay dựng video.' },
  { id: 13, category: 'A', text: 'Thích chơi nhạc cụ, ca hát hoặc tham gia các hoạt động biểu diễn nghệ thuật.' },
  { id: 14, category: 'A', text: 'Thích tự do thể hiện phong cách cá nhân, không muốn bị gò bó vào quy tắc rập khuôn.' },
  { id: 15, category: 'A', text: 'Thích trang trí không gian sống, thiết kế thời trang hoặc phối màu thẩm mỹ.' },

  // Social (S) - Xã hội
  { id: 16, category: 'S', text: 'Thích giảng giải, hướng dẫn hoặc kèm cặp người khác khi họ gặp khó khăn trong học tập.' },
  { id: 17, category: 'S', text: 'Thích lắng nghe, thấu cảm và giúp bạn bè giải tỏa những áp lực tâm lý.' },
  { id: 18, category: 'S', text: 'Thích tham gia các hoạt động thiện nguyện, phong trào thanh niên vì cộng đồng.' },
  { id: 19, category: 'S', text: 'Thích làm việc trong tập thể nơi mọi người hợp tác thân thiện và hỗ trợ lẫn nhau.' },
  { id: 20, category: 'S', text: 'Thích chăm sóc sức khỏe, hỗ trợ người yếu thế hoặc dạy dỗ các em nhỏ.' },

  // Enterprising (E) - Quản lý
  { id: 21, category: 'E', text: 'Thích thuyết phục người khác đồng tình với quan điểm hoặc dự án của mình.' },
  { id: 22, category: 'E', text: 'Thích làm nhóm trưởng, đứng ra tổ chức sự kiện hoặc dẫn dắt tập thể.' },
  { id: 23, category: 'E', text: 'Thích kinh doanh, mua bán, đàm phán hoặc thử nghiệm các ý tưởng kiếm thêm thu nhập.' },
  { id: 24, category: 'E', text: 'Thích đặt ra mục tiêu tham vọng và dám chấp nhận thử thách để đạt thành công lớn.' },
  { id: 25, category: 'E', text: 'Thích thuyết trình trước đám đông, truyền cảm hứng và tạo ảnh hưởng tích cực.' },

  // Conventional (C) - Nghiệp vụ
  { id: 26, category: 'C', text: 'Thích sắp xếp tài liệu, tập tin, góc học tập ngăn nắp và có hệ thống khoa học.' },
  { id: 27, category: 'C', text: 'Thích làm việc với bảng tính Excel, hóa đơn, số liệu rõ ràng và tính toán chính xác.' },
  { id: 28, category: 'C', text: 'Thích tuân thủ đúng các quy trình, thời hạn (deadline) và hướng dẫn chi tiết.' },
  { id: 29, category: 'C', text: 'Thích rà soát kỹ lưỡng các chi tiết để tránh xảy ra sai sót trong văn bản, bài làm.' },
  { id: 30, category: 'C', text: 'Thích công việc có kế hoạch làm việc cố định, rõ ràng và ổn định lâu dài.' }
]

// Hệ thống ánh xạ mã Holland sang đặc tính môi trường làm việc thực tế:
export const hollandDescriptions = {
  'R': 'Thực tế / Kỹ thuật (Thích làm việc với máy móc, công cụ, không gian vật lý)',
  'I': 'Nghiên cứu (Thích tư duy trừu tượng, phân tích dữ liệu, giải quyết vấn đề phức tạp)',
  'A': 'Nghệ thuật (Thích sáng tạo, tự do, không gian thể hiện cái tôi thẩm mỹ)',
  'S': 'Xã hội (Thích giúp đỡ, giảng dạy, giao tiếp và chăm sóc con người)',
  'E': 'Quản lý / Doanh nhân (Thích lãnh đạo, thuyết phục, cạnh tranh đạt mục tiêu tài chính)',
  'C': 'Nghiệp vụ / Văn phòng (Thích sự ngăn nắp, quy trình rõ ràng, xử lý giấy tờ, con số chính xác)'
};

// Danh mục hồ sơ RIASEC các nhóm ngành đại học toàn diện (Chuẩn GDPT & Khung phân ngành quốc tế)
export const CAREER_HOLLAND_PROFILES = [
  {
    id: 'it_ai',
    categoryName: 'Công nghệ thông tin & Trí tuệ nhân tạo (AI)',
    keywords: [
      'công nghệ', 'it', 'phần mềm', 'lập trình', 'ai', 'trí tuệ nhân tạo', 'khoa học máy tính',
      'khoa học dữ liệu', 'an ninh mạng', 'an toàn thông tin', 'mạng máy tính', 'hệ thống thông tin',
      'tin học', 'data', 'software', 'developer', 'game', 'vi mạch', 'iot', 'robot'
    ],
    expectedCodes: ['I', 'R', 'C'],
    expectedDesc: 'Nghiên cứu & Kỹ thuật (Tư duy giải thuật logic, phân tích hệ thống, kiên trì gỡ lỗi)',
    workEnvironment: 'Ngồi làm việc với máy tính độc lập nhiều giờ, liên tục cập nhật công nghệ và mã nguồn mới, tư duy giải quyết vấn đề trừu tượng.',
    coreSkills: 'Tư duy logic thuật toán, tự học bền bỉ, gỡ lỗi (debugging), chịu được tính chất làm việc tĩnh lặng chuyên sâu.',
    commonBlindSpots: 'Bẫy hào quang mức lương "nghìn đô" của ngành IT; nhầm lẫn việc "thích chơi game, lướt mạng" với năng lực ngồi viết và sửa lỗi hàng ngàn dòng code bền bỉ.',
    socraticQuestions: [
      'Em có sẵn sàng dành 6 - 8 tiếng mỗi ngày chỉ để ngồi đơn độc tìm 1 lỗi nhỏ (bug) trong hàng ngàn dòng mã lệnh mà không nản lòng không?',
      'Em chọn ngành IT vì thực sự đam mê cấu trúc thuật toán hay vì nghe nói ngành này lương cao, dễ kiếm việc?'
    ]
  },
  {
    id: 'engineering',
    categoryName: 'Kỹ thuật, Cơ khí & Công nghệ bán dẫn',
    keywords: [
      'kỹ thuật', 'cơ khí', 'điện', 'điện tử', 'tự động hóa', 'cơ điện tử', 'ô tô', 'chế tạo máy',
      'xây dựng', 'kiến trúc công trình', 'vật liệu', 'bán dẫn', 'năng lượng', 'hàng hải', 'hàng không',
      'cầu đường', 'thủy lợi', 'địa chất', 'trắc địa', 'môi trường đô thị'
    ],
    expectedCodes: ['R', 'I', 'C'],
    expectedDesc: 'Thực tế & Nghiên cứu (Làm việc với máy móc thiết bị, bản vẽ kỹ thuật, an toàn công trình)',
    workEnvironment: 'Thao tác thực địa, nhà máy, công trường xưởng cơ khí, yêu cầu tính an toàn lao động và độ chính xác vật lý cao.',
    coreSkills: 'Đọc bản vẽ kỹ thuật, tư duy không gian và động lực học, tính cẩn trọng tỉ mỉ, thao tác thiết bị chuẩn xác.',
    commonBlindSpots: 'Tưởng làm kỹ sư chỉ là ngồi phòng lạnh thiết kế mô hình 3D; chưa lường trước điều kiện làm việc thực địa, tiếng ồn máy móc và bụi bặm công xưởng.',
    socraticQuestions: [
      'Em có chịu được môi trường làm việc thực địa tại công trường, xưởng chế tạo với tiếng ồn và dầu mỡ không?',
      'Khi một bản vẽ thi công bị sai số dẫn đến thiệt hại kinh tế, em sẽ đối diện với áp lực kỷ luật và trách nhiệm kỹ thuật ra sao?'
    ]
  },
  {
    id: 'business_marketing',
    categoryName: 'Kinh tế, Quản trị kinh doanh & Marketing',
    keywords: [
      'kinh tế', 'quản trị', 'kinh doanh', 'marketing', 'tiếp thị', 'thương mại', 'thương mại điện tử',
      'logistics', 'chuỗi cung ứng', 'xuất nhập khẩu', 'bất động sản', 'ngoại thương', 'quản trị nhân lực',
      'kinh doanh quốc tế', 'pr', 'bán hàng', 'sales', 'quản lý'
    ],
    expectedCodes: ['E', 'S', 'C'],
    expectedDesc: 'Quản lý & Xã hội (Giao tiếp thuyết phục, nhạy bén thị trường, đàm phán và chịu áp lực KPI)',
    workEnvironment: 'Môi trường cạnh tranh thương trường khốc liệt, tiếp xúc khách hàng liên tục, làm việc theo nhóm và chịu chỉ tiêu doanh số hàng tháng.',
    coreSkills: 'Kỹ năng thuyết trình, đàm phán thương lượng, nhạy cảm xu hướng tiêu dùng, chịu áp lực số liệu kinh doanh.',
    commonBlindSpots: 'Bẫy danh xưng hào nhoáng "Giám đốc / Nhà quản trị"; chưa chuẩn bị tâm lý phải bắt đầu từ vị trí nhân viên bán hàng thực chiến chạy chỉ tiêu gắt gao.',
    socraticQuestions: [
      'Nếu trong 3 tháng liên tiếp em không đạt chỉ tiêu doanh số (KPI) và đối mặt với nguy cơ bị cắt thưởng hoặc khiển trách, em sẽ vượt qua thế nào?',
      'Em chọn Quản trị kinh doanh vì có tầm nhìn chiến lược thương mại cụ thể hay vì chưa biết chọn ngành nào nên chọn một ngành có vẻ "rộng"?'
    ]
  },
  {
    id: 'finance_accounting',
    categoryName: 'Tài chính, Kế toán & Kiểm toán',
    keywords: [
      'tài chính', 'kế toán', 'kiểm toán', 'ngân hàng', 'thuế', 'chứng khoán', 'đầu tư',
      'bảo hiểm', 'phân tích tài chính', 'thẩm định giá', 'tiền tệ', 'ngân khố'
    ],
    expectedCodes: ['C', 'E', 'I'],
    expectedDesc: 'Nghiệp vụ & Quản lý (Kỷ luật với số liệu, quy chuẩn pháp lý tài chính, phân tích rủi ro tiền tệ)',
    workEnvironment: 'Văn phòng chuyên nghiệp, làm việc liên tục với bảng biểu, hóa đơn chứng từ, chịu áp lực khủng khiếp vào mùa quyết toán cuối năm.',
    coreSkills: 'Độ cẩn trọng chi tiết tuyệt đối, tính trung thực đạo đức nghề nghiệp, phân tích báo cáo tài chính, thành thạo công cụ bảng tính.',
    commonBlindSpots: 'Nghĩ làm kế toán/ngân hàng là "nhàn nhã, đếm tiền trong máy lạnh"; chưa lường trước mùa quyết toán thức trắng đêm và trách nhiệm pháp lý khi sai sót 1 con số.',
    socraticQuestions: [
      'Em có đủ kiên nhẫn để ngồi rà soát hàng ngàn dòng chứng từ hóa đơn để tìm ra khoản chênh lệch chỉ vài chục ngàn đồng không?',
      'Trước những áp lực từ cấp trên yêu cầu "làm đẹp" số liệu sổ sách, em có bản lĩnh đạo đức để từ chối và bảo vệ sự thật không?'
    ]
  },
  {
    id: 'pedagogy_education',
    categoryName: 'Sư phạm & Khoa học Giáo dục',
    keywords: [
      'sư phạm', 'giáo dục', 'giảng dạy', 'giáo viên', 'thầy cô', 'đào tạo', 'mầm non',
      'tiểu học', 'trung học', 'giáo dục đặc biệt', 'quản lý giáo dục'
    ],
    expectedCodes: ['S', 'A', 'I'],
    expectedDesc: 'Xã hội & Nghệ thuật (Thấu cảm người học, kiên nhẫn giảng dạy, truyền cảm hứng và chuẩn mực đạo đức)',
    workEnvironment: 'Trường học, lớp học, tương tác liên tục với học sinh, phụ huynh và đồng nghiệp; chuẩn mực hành vi mô phạm nghiêm ngặt.',
    coreSkills: 'Kỹ năng sư phạm, kiên nhẫn thấu cảm, soạn thảo giáo án sáng tạo, quản lý lớp học và xử lý tình huống tâm lý học sinh.',
    commonBlindSpots: 'Nghĩ nghề giáo "ổn định, nhàn hạ, có 3 tháng nghỉ hè"; chưa thấy áp lực đổi mới phương pháp GDPT 2018, hồ sơ sổ sách và áp lực kỳ vọng từ phụ huynh.',
    socraticQuestions: [
      'Khi gặp một học sinh cá biệt không chịu lắng nghe, thậm chí phản ứng tiêu cực, em có giữ được sự bình tĩnh sư phạm để tìm hiểu nguyên nhân không?',
      'Em yêu nghề dạy học vì muốn cống hiến nâng đỡ thế hệ trẻ, hay chỉ xem đây là chỗ trú chân ổn định và đỡ áp lực xin việc?'
    ]
  },
  {
    id: 'medicine_healthcare',
    categoryName: 'Y khoa, Dược học & Chăm sóc sức khỏe',
    keywords: [
      'y khoa', 'y tế', 'bác sĩ', 'dược', 'dược sĩ', 'điều dưỡng', 'răng hàm mặt', 'y học cổ truyền',
      'xét nghiệm', 'chẩn đoán hình ảnh', 'y tế công cộng', 'thú y', 'phục hồi chức năng'
    ],
    expectedCodes: ['I', 'S', 'R'],
    expectedDesc: 'Nghiên cứu & Xã hội (Trách nhiệm sinh mệnh con người, học tập suốt đời, áp lực trực đêm)',
    workEnvironment: 'Bệnh viện, phòng khám, nhà thuốc; đối diện với nỗi đau thể xác, bệnh tật và áp lực cấp cứu khẩn trương mọi thời điểm.',
    coreSkills: 'Trí nhớ học thuật khổng lồ, kỹ năng lâm sàng chính xác, tinh thần thép trước cảnh máu me, lòng trắc ẩn cứu người.',
    commonBlindSpots: 'Chọn Y Dược theo định hướng gia đình "nhất Y nhì Dược" để lấy danh tiếng; chưa chuẩn bị cho 6 - 9 năm học tập gian khổ và các ca trực thâu đêm.',
    socraticQuestions: [
      'Em có đủ bản lĩnh để thức trắng đêm trực cấp cứu, liên tục đối diện với ranh giới sinh tử của bệnh nhân mà vẫn giữ sự tỉnh táo tuyệt đối không?',
      'Em chọn Y vì thực sự muốn xoa dịu nỗi đau của người bệnh, hay vì ánh hào quang chiếc áo blouse trắng trong mắt họ hàng?'
    ]
  },
  {
    id: 'social_humanities',
    categoryName: 'Tâm lý học, Công tác xã hội & Nhân văn',
    keywords: [
      'tâm lý', 'xã hội học', 'công tác xã hội', 'nhân học', 'triết học', 'lịch sử', 'địa lý',
      'việt nam học', 'đông phương học', 'quốc tế học', 'tôn giáo', 'văn học'
    ],
    expectedCodes: ['S', 'I', 'A'],
    expectedDesc: 'Xã hội & Nghiên cứu (Lắng nghe thân chủ, thấu hiểu đa dạng văn hóa, giải mã hành vi con người)',
    workEnvironment: 'Trung tâm tư vấn tâm lý, tổ chức phi chính phủ (NGO), trường học, viện nghiên cứu; tiếp nhận câu chuyện phức tạp của con người.',
    coreSkills: 'Lắng nghe không phán xét, thấu cảm sâu sắc, tư duy phân tích nguyên nhân tâm lý, khả năng thiết lập ranh giới cảm xúc an toàn.',
    commonBlindSpots: 'Ảo tưởng học tâm lý là có "siêu năng lực đọc suy nghĩ người khác"; nguy cơ bị kiệt quệ cảm xúc (burnout) do gánh chịu năng lượng tiêu cực từ thân chủ.',
    socraticQuestions: [
      'Em có kỹ năng bảo vệ tâm lý của chính mình khi hàng ngày phải lắng nghe những bi kịch, trầm cảm và bế tắc từ người khác không?',
      'Em muốn học Tâm lý để trị liệu cho xã hội, hay vô thức tìm kiếm giải pháp chữa lành cho chính những tổn thương chưa giải quyết của bản thân?'
    ]
  },
  {
    id: 'languages_translation',
    categoryName: 'Ngôn ngữ học & Biên phiên dịch quốc tế',
    keywords: [
      'ngôn ngữ', 'tiếng anh', 'tiếng trung', 'tiếng hàn', 'tiếng nhật', 'tiếng pháp', 'tiếng đức',
      'biên dịch', 'phiên dịch', 'ngoại ngữ', 'ngôn ngữ học', 'dịch thuật'
    ],
    expectedCodes: ['A', 'S', 'C'],
    expectedDesc: 'Nghệ thuật & Xã hội (Cảm thụ ngôn từ, giao lưu văn hóa đa quốc gia, tính chuẩn xác dịch thuật)',
    workEnvironment: 'Doanh nghiệp đa quốc gia, cơ quan ngoại giao, dịch thuật cabin tại hội nghị quốc tế, giảng dạy hoặc biên tập nội dung toàn cầu.',
    coreSkills: 'Phản xạ ngoại ngữ tức thì, vốn từ vựng học thuật sâu, hiểu biết tinh tế văn hóa bản địa, khả năng sử dụng công cụ AI hỗ trợ dịch thuật.',
    commonBlindSpots: 'Nghĩ biết giao tiếp ngoại ngữ là đủ làm ngành ngôn ngữ; chưa thấy thách thức từ văn phạm học thuật và sự thay thế mạnh mẽ của công cụ AI dịch thuật.',
    socraticQuestions: [
      'Trong thời đại AI có thể dịch chuẩn xác theo thời gian thực, giá trị độc bản nào của em sẽ khiến doanh nghiệp trả lương cao cho em?',
      'Em yêu thích ngôn ngữ đó vì thích văn hóa giải trí (âm nhạc, phim ảnh), hay thực sự sẵn sàng nghiên cứu cấu trúc ngữ pháp và ngữ nghĩa học thuật?'
    ]
  },
  {
    id: 'media_communication',
    categoryName: 'Truyền thông, Báo chí & Quan hệ công chúng (PR)',
    keywords: [
      'truyền thông', 'báo chí', 'pr', 'quan hệ công chúng', 'tổ chức sự kiện', 'nội dung',
      'content', 'copywriter', 'biên tập', 'phát thanh', 'truyền hình', 'quảng cáo'
    ],
    expectedCodes: ['A', 'E', 'S'],
    expectedDesc: 'Nghệ thuật & Quản lý (Sáng tạo nội dung xu hướng, kết nối công chúng, xử lý khủng hoảng thông tin)',
    workEnvironment: 'Cơ quan báo chí, agency truyền thông, bộ phận marketing; môi trường năng động, chạy đua với xu hướng và deadline từng phút.',
    coreSkills: 'Viết lách sáng tạo, nhạy bén tin tức thời sự, biên tập đa phương tiện, kỹ năng ứng biến khủng hoảng truyền thông.',
    commonBlindSpots: 'Bị hào nhoáng bởi việc được gặp người nổi tiếng, tham gia sự kiện sang chảnh; chưa lường trước áp lực cạn kiệt ý tưởng sáng tạo và chỉ tiêu lượt xem (view, KPI).',
    socraticQuestions: [
      'Em có sẵn sàng thức dậy lúc 2h sáng để xử lý một khủng hoảng truyền thông mạng xã hội cho nhãn hàng mà không một lời than vãn không?',
      'Em muốn làm truyền thông để lan tỏa sự thật và giá trị tích cực, hay chỉ vì thích cảm giác bắt trend và được đám đông chú ý?'
    ]
  },
  {
    id: 'design_architecture',
    categoryName: 'Thiết kế đồ họa, Kiến trúc & Mỹ thuật sáng tạo',
    keywords: [
      'thiết kế', 'đồ họa', 'kiến trúc', 'mỹ thuật', 'nội thất', 'thời trang', 'nhiếp ảnh',
      'quay phim', 'đạo diễn', 'hoạt hình', 'ui/ux', 'multimedia', 'tạo dáng công nghiệp'
    ],
    expectedCodes: ['A', 'R', 'I'],
    expectedDesc: 'Nghệ thuật & Thực tế (Tư duy không gian thị giác, biến ý tưởng thành sản phẩm, làm chủ công cụ thiết kế)',
    workEnvironment: 'Studio sáng tạo, văn phòng kiến trúc; làm việc tập trung cao độ với các phần mềm thiết kế đồ họa 2D/3D chuyên nghiệp.',
    coreSkills: 'Gu thẩm mỹ bố cục & màu sắc, sử dụng thành thạo phần mềm thiết kế, tư duy trực quan hóa ý tưởng, tiếp nhận phản hồi đóng góp.',
    commonBlindSpots: 'Muốn vẽ tự do theo cảm hứng cá nhân; khi vào nghề bị sốc vì phải sửa thiết kế theo ý khách hàng cả chục lần dù thiết kế đó đi ngược lại quan điểm thẩm mỹ của mình.',
    socraticQuestions: [
      'Khi khách hàng yêu cầu em sửa lại toàn bộ bản vẽ thiết kế tâm huyết theo một phong cách em thấy rất xấu, em sẽ xử lý cảm xúc ra sao?',
      'Em chọn thiết kế vì thực sự đam mê giải quyết bài toán thị giác thương mại, hay chỉ vì thích vẽ tranh những lúc rảnh rỗi?'
    ]
  },
  {
    id: 'law_security',
    categoryName: 'Luật học, An ninh & Hành chính công',
    keywords: [
      'luật', 'pháp luật', 'luật kinh tế', 'luật quốc tế', 'tòa án', 'công an', 'an ninh',
      'quân sự', 'quản lý nhà nước', 'công chức', 'công chứng', 'tư pháp'
    ],
    expectedCodes: ['E', 'C', 'I'],
    expectedDesc: 'Quản lý & Nghiệp vụ (Tư duy logic phản biện, nghiêm cẩn quy chuẩn pháp lý, nguyên tắc kỷ luật)',
    workEnvironment: 'Văn phòng luật, tòa án, cơ quan nhà nước; làm việc với hệ thống văn bản pháp quy đồ sộ, yêu cầu chuẩn mực ngôn từ và tính bảo mật.',
    coreSkills: 'Tư duy logic lập luận sắc bén, trí nhớ văn bản quy phạm pháp luật, năng lực tranh tụng bảo vệ quan điểm, kỷ luật hành chính.',
    commonBlindSpots: 'Nghĩ làm luật sư là đứng trước tòa tranh luận hùng hồn như phim truyền hình; thực tế 90% thời gian là ngồi nghiền ngẫm hàng nghìn trang tài liệu khô khan.',
    socraticQuestions: [
      'Em có đủ kiên trì để đọc kỹ từng câu chữ của hàng trăm bộ luật và nghị định sửa đổi để tìm ra một kẽ hở pháp lý có lợi cho thân chủ không?',
      'Khi nguyên tắc pháp luật xung đột với tình cảm cá nhân hoặc áp lực từ người thân, em có đủ dũng khí để giữ vững sự thượng tôn pháp luật không?'
    ]
  },
  {
    id: 'tourism_hospitality',
    categoryName: 'Du lịch, Khách sạn & Dịch vụ hàng không',
    keywords: [
      'du lịch', 'khách sạn', 'nhà hàng', 'lữ hành', 'hàng không', 'tiếp viên', 'hướng dẫn viên',
      'ẩm thực', 'pha chế', 'resort', 'dịch vụ khách hàng'
    ],
    expectedCodes: ['E', 'S', 'R'],
    expectedDesc: 'Quản lý & Xã hội (Chăm sóc khách hàng đa văn hóa, linh hoạt xử lý biến cố, dẻo dai thể lực)',
    workEnvironment: 'Khách sạn cao cấp, sân bay, khu nghỉ dưỡng, địa điểm tham quan; làm việc theo ca kíp, thường xuyên vào các dịp lễ tết và cuối tuần.',
    coreSkills: 'Giao tiếp ứng xử thanh lịch, xử lý tình huống khẩn cấp, sức bền thể lực, khả năng giữ nụ cười và năng lượng tích cực trước khách hàng khó tính.',
    commonBlindSpots: 'Tưởng làm du lịch lữ hành là "được đi chơi miễn phí khắp nơi"; thực tế là người phục vụ người khác trong lúc họ nghỉ ngơi và chịu trách nhiệm an toàn cho toàn đoàn.',
    socraticQuestions: [
      'Em có chấp nhận việc toàn bộ các dịp lễ Tết, ngày nghỉ của gia đình em đều phải đi làm để phục vụ người khác đang đi nghỉ dưỡng không?',
      'Khi một khách hàng nổi giận vô cớ và có lời lẽ khó nghe giữa sảnh khách sạn, em sẽ kiểm soát bản thân như thế nào để vừa giữ uy tín thương hiệu vừa bảo vệ chính mình?'
    ]
  },
  {
    id: 'agriculture_nature',
    categoryName: 'Nông nghiệp công nghệ cao, Lâm nghiệp & Thú y',
    keywords: [
      'nông nghiệp', 'lâm nghiệp', 'thủy sản', 'chăn nuôi', 'thú y', 'cây trồng', 'sinh học ứng dụng',
      'công nghệ sinh học', 'môi trường sinh thái', 'đất đai', 'bảo tồn'
    ],
    expectedCodes: ['R', 'I', 'S'],
    expectedDesc: 'Thực tế & Nghiên cứu (Gắn bó thiên nhiên sinh thái, thí nghiệm giống loài, kiên trì chu kỳ phát triển)',
    workEnvironment: 'Trang trại công nghệ cao, trung tâm bảo tồn, viện nghiên cứu sinh học; thường xuyên tiếp xúc với đất đai, cây trồng và vật nuôi ngoài trời.',
    coreSkills: 'Kỹ năng quan sát thực địa, kiên trì theo dõi chu kỳ sinh trưởng, áp dụng công nghệ vi sinh & tự động hóa vào nông nghiệp.',
    commonBlindSpots: 'Thích ý niệm "sống xanh, yêu thiên nhiên" nhưng ngại bẩn, sợ côn trùng, sợ mùi hôi chuồng trại và thời tiết khắc nghiệt ngoài trời.',
    socraticQuestions: [
      'Em có sẵn sàng lội bùn, làm việc dưới trời nắng gắt hoặc kiểm tra mầm bệnh vật nuôi trong chuồng trại nhiều giờ không?',
      'Khi một vụ mùa thử nghiệm công nghệ cao bị thất bại do dịch bệnh bất thường, em có đủ kiên nhẫn để bắt đầu lại từ đầu một chu kỳ kéo dài nhiều tháng không?'
    ]
  }
];

// Hàm tra cứu hồ sơ RIASEC của ngành nghề bất kỳ với Fallback thông minh
export function getCareerHollandProfile(careerName) {
  if (!careerName || typeof careerName !== 'string' || !careerName.trim()) {
    return {
      id: 'default',
      categoryName: 'Chưa xác định rõ ngành',
      expectedCodes: ['S', 'E', 'C'],
      expectedDesc: 'Cần xác định ngành nghề cụ thể để đối chiếu môi trường làm việc',
      workEnvironment: 'Môi trường làm việc phụ thuộc vào ngành nghề em lựa chọn.',
      coreSkills: 'Kỹ năng chuyên môn và khả năng thích ứng linh hoạt.',
      commonBlindSpots: 'Chưa có mục tiêu nghề nghiệp rõ ràng dẫn đến thiếu định hướng hành động và chuẩn bị năng lực.',
      socraticQuestions: [
        'Em đang gặp khó khăn gì trong việc gọi tên ngành nghề mình thực sự muốn theo đuổi?',
        'Điều gì ngăn cản em đưa ra một lựa chọn cụ thể lúc này?'
      ]
    };
  }

  const nameLower = careerName.toLowerCase().trim();
  
  // 1. Tìm kiếm khớp trong danh mục chuẩn theo keywords
  const matched = CAREER_HOLLAND_PROFILES.find(p => 
    p.keywords.some(k => nameLower.includes(k)) || nameLower.includes(p.categoryName.toLowerCase())
  );

  if (matched) return matched;

  // 2. Dự đoán thông minh dựa trên từ khóa hàn lâm / khoa học
  if (nameLower.includes('học') || nameLower.includes('nghiên cứu') || nameLower.includes('khoa')) {
    return {
      id: 'custom_science',
      categoryName: `Khoa học & Nghiên cứu chuyên sâu (${careerName})`,
      expectedCodes: ['I', 'R', 'C'],
      expectedDesc: 'Nghiên cứu & Khám phá (Tư duy lý thuyết, thực nghiệm khoa học, đào sâu bản chất)',
      workEnvironment: 'Phòng thí nghiệm, viện nghiên cứu hoặc môi trường học thuật chuyên sâu.',
      coreSkills: 'Tư duy phản biện, phương pháp luận nghiên cứu, kiên trì thử nghiệm khoa học.',
      commonBlindSpots: 'Dễ xa rời thực tế ứng dụng thương mại nếu chỉ tập trung nghiên cứu lý thuyết thuần túy.',
      socraticQuestions: [
        `Em có thực sự hứng thú với việc đào sâu kiến thức hàn lâm của ngành ${careerName} không?`,
        `Em hình dung công việc hằng ngày của một người làm ngành ${careerName} sẽ diễn ra như thế nào?`
      ]
    };
  }

  // 3. Fallback an toàn, khoa học, bao quát toàn diện
  return {
    id: 'custom_general',
    categoryName: `Khối ngành Chuyên môn (${careerName})`,
    expectedCodes: ['E', 'S', 'C'],
    expectedDesc: 'Đòi hỏi sự kết hợp giữa năng lực chuyên môn, kỹ năng giao tiếp và tính kỷ luật quy trình',
    workEnvironment: `Môi trường tổ chức doanh nghiệp hoặc cơ quan chuyên trách lĩnh vực ${careerName}.`,
    coreSkills: 'Năng lực chuyên môn đặc thù, kỹ năng giải quyết vấn đề và làm việc nhóm.',
    commonBlindSpots: `Chưa tìm hiểu kỹ mô tả công việc (Job Description) và áp lực thực tế của ngành ${careerName}.`,
    socraticQuestions: [
      `Em đã từng nói chuyện với một người đang làm nghề ${careerName} từ 3 năm trở lên chưa?`,
      `Đâu là rào cản lớn nhất mà em nghĩ mình sẽ gặp phải khi theo đuổi ngành ${careerName}?`
    ]
  };
}

// Hàm đánh giá mức độ tương thích RIASEC chuẩn hóa (Trả về Object giàu dữ liệu)
export function evaluateHollandCompatibility(careerName, userHollandCodes) {
  const codes = Array.isArray(userHollandCodes)
    ? userHollandCodes.filter(c => ['R','I','A','S','E','C'].includes(String(c).toUpperCase())).map(c => String(c).toUpperCase())
    : (typeof userHollandCodes === 'string' ? userHollandCodes.toUpperCase().replace(/[^RIASEC]/g, '').split('') : ['A', 'S', 'E']);

  const cleanCodes = codes.length > 0 ? codes.slice(0, 3) : ['A', 'S', 'E'];
  const userPrimary = cleanCodes[0] || 'A';
  const userSecondary = cleanCodes[1] || 'S';
  const userTertiary = cleanCodes[2] || 'E';

  const profile = getCareerHollandProfile(careerName);
  const targetCodes = profile.expectedCodes;

  // Tính điểm tương thích theo trọng số vị trí (Tối đa 100 điểm)
  let score = 15; // Điểm nền tảng thích ứng con người
  if (targetCodes.includes(userPrimary)) {
    score += (userPrimary === targetCodes[0]) ? 40 : 30;
  }
  if (targetCodes.includes(userSecondary)) {
    score += (userSecondary === targetCodes[1]) ? 25 : 20;
  }
  if (targetCodes.includes(userTertiary)) {
    score += 15;
  }
  // Giới hạn trong khoảng 25 - 96%
  score = Math.min(Math.max(score, 25), 96);

  const matchedCodes = cleanCodes.filter(c => targetCodes.includes(c));
  const gapCodes = targetCodes.filter(c => !cleanCodes.includes(c));

  let level = 'medium';
  let levelLabel = 'Tương thích một phần';
  let levelColor = 'amber';
  let levelSummary = 'Em sở hữu một số tố chất phù hợp nhưng cần chủ động thích ứng với các đòi hỏi khắt khe của nghề.';

  if (score >= 65) {
    level = 'high';
    levelLabel = 'Tương thích cao';
    levelColor = 'emerald';
    levelSummary = 'Thiên hướng tính cách tự nhiên của em rất đồng điệu với môi trường và đòi hỏi cốt lõi của ngành nghề này!';
  } else if (score < 45) {
    level = 'low';
    levelLabel = 'Cảnh báo lệch pha nhận thức';
    levelColor = 'rose';
    levelSummary = 'Có độ vênh lớn giữa thiên hướng tự nhiên đo được và môi trường công việc thực tế hằng ngày của ngành.';
  }

  return {
    targetCareer: (careerName && careerName.trim()) ? careerName.trim() : 'Ngành mục tiêu',
    profile,
    userCodes: cleanCodes,
    targetCodes,
    compatibilityScore: score,
    level,
    levelLabel,
    levelColor,
    levelSummary,
    matchedCodes,
    gapCodes,
    userPrimary,
    userSecondary,
    userTertiary
  };
}

// Hàm phân tích mức độ tương thích giữa Ngành mong muốn và Kết quả Holland (Bảo toàn tương thích ngược)
export function analyzeHollandCompatibility(targetCareer, userHollandCodes) {
  const evalResult = evaluateHollandCompatibility(targetCareer, userHollandCodes);
  const { targetCareer: career, profile, userCodes, targetCodes, compatibilityScore, levelLabel, levelSummary, matchedCodes, gapCodes } = evalResult;

  const matchedDesc = matchedCodes.length > 0
    ? matchedCodes.map(c => `${c} (${hollandDescriptions[c]?.split(' ')[0] || c})`).join(', ')
    : 'Chưa có nhóm nào trùng khớp trực tiếp';

  const gapDesc = gapCodes.length > 0
    ? gapCodes.map(c => `${c} (${hollandDescriptions[c]?.split(' ')[0] || c})`).join(', ')
    : 'Không có độ lệch đáng kể';

  return `📊 ĐỐI CHIẾU THIÊN HƯỚNG RIASEC VÀ NGÀNH MỤC TIÊU:
• Ngành đối chiếu: "${career}" (${profile.categoryName})
• Thiên hướng của em: [${userCodes.join(', ')}]
• Đòi hỏi môi trường nghề: [${targetCodes.join(', ')}] (${profile.expectedDesc})
• Mức độ tương thích: ${compatibilityScore}% - ${levelLabel}
• Đánh giá cốt lõi: ${levelSummary}
• Tố chất sẵn có hỗ trợ nghề: ${matchedDesc}
• Thách thức môi trường cần lưu ý: Nghề đòi hỏi cao nhóm [${gapDesc}], nơi em có thể cảm thấy áp lực nếu thiếu sự rèn luyện bền bỉ.
• Điểm mù nhận thức cần phản tư: ${profile.commonBlindSpots}`;
}

// Hàm tóm tắt ngắn gọn mức độ tương thích giữa Ngành mong muốn và Kết quả Holland
export function getCompatibilitySummary(targetCareer, userHollandCodes) {
  const evalResult = evaluateHollandCompatibility(targetCareer, userHollandCodes);
  const { targetCareer: career, profile, userCodes, targetCodes, compatibilityScore, levelLabel } = evalResult;
  return `[${career}] Độ tương thích ${compatibilityScore}% (${levelLabel}). Thiên hướng học sinh [${userCodes.join('')}] so với chuẩn ngành [${targetCodes.join('')} - ${profile.categoryName}]. Điểm mù nhận thức: ${profile.commonBlindSpots}`;
}

const HollandTest = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  
  const [questions, setQuestions] = useState(DEFAULT_HOLLAND_QUESTIONS)
  const [answers, setAnswers] = useState({})
  const [currentPage, setCurrentPage] = useState(0) // 0 to 5 for questions (5 questions/page)
  // 3 Giai đoạn cốt lõi theo đặc tả khoa học ViSEF CBAS 2026:
  // 'anchor': Giai đoạn 1 - Bộc lộ mỏ neo chủ quan (T0)
  // 'quiz': Giai đoạn 2 - Khảo sát thiên hướng khách quan (30 câu RIASEC)
  // 'result': Giai đoạn 3 - Phát hiện mâu thuẫn nhận thức & Đối chiếu kết quả
  const [stepPhase, setStepPhase] = useState('anchor')
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Trạng thái Form Mỏ Neo Nhận thức (Initial Anchor - Chuẩn ViSEF 2026: 4 trường bắt buộc)
  const [targetMajor, setTargetMajor] = useState('Sư phạm')
  const [targetSchool, setTargetSchool] = useState('ĐH Quy Nhơn')
  const [targetUniversity, setTargetUniversity] = useState('ĐH Quy Nhơn')
  const [reason, setReason] = useState('Em thích từ nhỏ')
  const [choiceSource, setChoiceSource] = useState('Đam mê từ nhỏ')
  const [customChoiceSource, setCustomChoiceSource] = useState('')
  const [confidenceScore, setConfidenceScore] = useState(8) // 1-10
  const [expectedIncome, setExpectedIncome] = useState('15 - 20 triệu/tháng')
  const [calculatedRiasecCode, setCalculatedRiasecCode] = useState('')
  
  // Trạng thái kết quả sau khi nộp
  const [result, setResult] = useState(null)
  const [recommendedMajors, setRecommendedMajors] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeCompareMajor, setActiveCompareMajor] = useState('')
  const [customCompareInput, setCustomCompareInput] = useState('')

  // Xử lý đối chiếu ngành nghề tùy chọn / ngành mẫu
  const handleSelectCompareMajor = (majorName) => {
    const cleanMajor = (majorName || '').trim() || activeCompareMajor || result?.anchorData?.target_major || result?.anchorData?.target_career || targetMajor || 'Quản trị kinh doanh'
    setActiveCompareMajor(cleanMajor)
    setCustomCompareInput(cleanMajor)
    setToast({ 
      type: 'success', 
      message: `✓ Đã đối chiếu thành công ngành: "${cleanMajor}"! Xem phân tích chi tiết bên trên.` 
    })
    
    // Tự động cuộn mượt mà lên bảng phân tích kết quả đối chiếu
    setTimeout(() => {
      const el = document.getElementById('compatibility-result-card')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  // Khôi phục về ngành mục tiêu mỏ neo T0 ban đầu
  const handleResetToInitialMajor = (initialMajor) => {
    const original = initialMajor || result?.anchorData?.target_major || result?.anchorData?.target_career || targetMajor || 'Sư phạm'
    setActiveCompareMajor('')
    setCustomCompareInput('')
    setToast({ 
      type: 'success', 
      message: `✓ Đã khôi phục về ngành mục tiêu ban đầu: "${original}"` 
    })
    setTimeout(() => {
      const el = document.getElementById('compatibility-result-card')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const questionsPerPage = 5
  const totalQuestionPages = Math.ceil(questions.length / questionsPerPage) // 6 pages for 30 questions

  useEffect(() => {
    fetchTestAndInitialAnchor()
  }, [user])

  const fetchTestAndInitialAnchor = async () => {
    setIsLoading(true)
    try {
      // 1. Tải câu hỏi từ Supabase (nếu có), nếu không dùng mặc định 30 câu
      const { data, error } = await supabase
        .from('career_tests')
        .select('*')
        .eq('type', 'holland')
        .maybeSingle()

      let qList = DEFAULT_HOLLAND_QUESTIONS
      if (!error && data && Array.isArray(data.questions_json) && data.questions_json.length >= 10) {
        qList = data.questions_json
      }
      setQuestions(qList)

      const initialAnswers = {}
      qList.forEach(q => { initialAnswers[q.id] = null })
      setAnswers(initialAnswers)

      let hasCompleted = false

      // 2. Tải mỏ neo đã lưu từ trước (ưu tiên cbas_user_profile)
      const cachedProfile = localStorage.getItem('cbas_user_profile')
      if (cachedProfile) {
        try {
          const p = JSON.parse(cachedProfile)
          if (p.targetMajor) setTargetMajor(p.targetMajor)
          if (p.targetSchool) {
            setTargetSchool(p.targetSchool)
            setTargetUniversity(p.targetSchool)
          }
          if (p.reason) setReason(p.reason)
          if (p.initialConfidence) setConfidenceScore(Number(p.initialConfidence))
          if (p.expectedIncome) setExpectedIncome(p.expectedIncome)
          if (p.hollandCode) setCalculatedRiasecCode(p.hollandCode)
        } catch (e) {
          console.warn('Lỗi đọc cbas_user_profile:', e)
        }
      }

      const cachedAnchor = localStorage.getItem('career_initial_anchor') || localStorage.getItem('cbas_anchor_data')
      if (cachedAnchor) {
        try {
          const parsed = JSON.parse(cachedAnchor)
          if (parsed.target_major || parsed.target_career) {
            setTargetMajor(parsed.target_major || parsed.target_career)
          }
          if (parsed.target_university) {
            setTargetSchool(parsed.target_university)
            setTargetUniversity(parsed.target_university)
          }
          if (parsed.choice_source || parsed.source_of_influence) {
            setReason(parsed.choice_source || parsed.source_of_influence)
          }
          if (parsed.confidence_score_initial || parsed.confidence_score) {
            setConfidenceScore(Number(parsed.confidence_score_initial || parsed.confidence_score))
          }
          if (parsed.expected_income || parsed.expectedIncome) {
            setExpectedIncome(parsed.expected_income || parsed.expectedIncome)
          }
          if (parsed.holland_code || parsed.primary_code) {
            setCalculatedRiasecCode(parsed.holland_code || parsed.primary_code)
          }
          if (parsed.scores && (parsed.primary_code || parsed.holland_code)) {
            setResult({
              scores: parsed.scores,
              primaryCode: parsed.primary_code || parsed.holland_code,
              anchorData: parsed
            })
            hasCompleted = true
          }
        } catch (e) {
          console.warn('Lỗi đọc mỏ neo từ localStorage:', e)
        }
      }

      // Nếu đã có kết quả hoàn tất trước đó thì hiển thị kết quả (GĐ 3), nếu không bắt đầu từ GĐ 1 (Mỏ neo)
      if (hasCompleted) {
        setStepPhase('result')
      } else {
        setStepPhase('anchor')
      }
    } catch (err) {
      console.warn('Sử dụng bộ 30 câu hỏi Holland mặc định:', err)
      setQuestions(DEFAULT_HOLLAND_QUESTIONS)
      setStepPhase('anchor')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSelect = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const pageQuestions = questions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  )

  const answeredCount = Object.values(answers).filter(val => val !== null).length
  const progressPercent = Math.round((answeredCount / (questions.length || 1)) * 100)

  // Hàm tính toán điểm RIASEC và mã nổi trội 3 chữ cái
  const calculateRiasecCode = () => {
    const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
    questions.forEach(q => {
      const val = answers[q.id]
      if (val === 4) scores[q.category] = (scores[q.category] || 0) + 3
      else if (val === 3) scores[q.category] = (scores[q.category] || 0) + 2
      else if (val === 2) scores[q.category] = (scores[q.category] || 0) + 1
    })

    const sortedCategories = Object.keys(scores)
      .map(key => ({ category: key, score: scores[key] }))
      .sort((a, b) => b.score - a.score || a.category.localeCompare(b.category))

    const primaryCode = sortedCategories.slice(0, 3).map(item => item.category).join('')
    return { scores, primaryCode }
  }

  // XỬ LÝ GIAI ĐOẠN 1: XÁC NHẬN MỎ NEO CHỦ QUAN (T0)
  const handleConfirmAnchor = () => {
    if (!targetMajor.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng nhập ngành nghề mục tiêu của em!' })
      return
    }
    if (!reason.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng điền lý do em chọn ngành nghề này!' })
      return
    }
    if (!expectedIncome) {
      setToast({ type: 'warning', message: 'Vui lòng chọn kỳ vọng mức thu nhập khởi điểm!' })
      return
    }

    const finalSchool = (targetSchool || targetUniversity || 'ĐH Quy Nhơn').trim()
    const tempProfile = {
      targetMajor: targetMajor.trim(),
      targetSchool: finalSchool,
      reason: reason.trim(),
      initialConfidence: Number(confidenceScore),
      expectedIncome: expectedIncome
    }
    const tempAnchorData = {
      target_career: tempProfile.targetMajor,
      target_university: tempProfile.targetSchool,
      source_of_influence: tempProfile.reason,
      confidence_score: String(tempProfile.initialConfidence),
      expected_income: tempProfile.expectedIncome
    }

    // Lưu tạm mỏ neo vào localStorage để bảo toàn dữ liệu
    try {
      localStorage.setItem("cbas_user_profile", JSON.stringify(tempProfile))
      localStorage.setItem("userAnchorData", JSON.stringify(tempAnchorData))
      localStorage.setItem("cbas_anchor_data", JSON.stringify(tempAnchorData))
    } catch(e) {}

    setToast({ type: 'success', message: '✓ Đã ghi nhận Mỏ neo chủ quan (T₀)! Tiếp tục thực hiện 30 câu hỏi trắc nghiệm RIASEC.' })
    setStepPhase('quiz')
    setCurrentPage(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // XỬ LÝ GIAI ĐOẠN 2: CHUYỂN TRANG CÂU HỎI
  const handleNextQuizPage = () => {
    const unanswered = pageQuestions.some(q => answers[q.id] === null)
    if (unanswered) {
      setToast({ type: 'warning', message: 'Vui lòng chọn câu trả lời cho cả 5 câu hỏi ở trang này nhé!' })
      return
    }

    if (currentPage < totalQuestionPages - 1) {
      setCurrentPage(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Đã hoàn tất 30 câu -> Nộp bài & Phát hiện mâu thuẫn nhận thức (GĐ 3)
      handleSubmitQuizAndDetectConflict()
    }
  }

  const handleBackQuizPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Đang ở trang 0 bấm quay lại -> Trở về Form mỏ neo chủ quan T0
      setStepPhase('anchor')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    window.analyzeHollandCompatibility = analyzeHollandCompatibility;
    return () => {
      delete window.analyzeHollandCompatibility;
    };
  }, []);

  // XỬ LÝ NỘP BÀI TRẮC NGHIỆM & ĐỐI CHIẾU MÂU THUẪN NHẬN THỨC (GIAI ĐOẠN 3)
  const handleSubmitQuizAndDetectConflict = async () => {
    const unansweredCount = questions.filter(q => answers[q.id] === null).length
    if (unansweredCount > 0) {
      setToast({ 
        type: 'warning', 
        message: `Em còn ${unansweredCount} câu trắc nghiệm chưa trả lời. Vui lòng hoàn thành để hệ thống phân tích chính xác nhất!` 
      })
      return
    }

    if (!targetMajor.trim() || !reason.trim() || !expectedIncome) {
      setToast({ type: 'warning', message: 'Vui lòng kiểm tra lại thông tin mỏ neo chủ quan T0!' })
      setStepPhase('anchor')
      return
    }

    setIsSubmitting(true)
    try {
      const { scores, primaryCode } = calculateRiasecCode()
      const effectiveCode = primaryCode || calculatedRiasecCode || "AEI"
      const finalSchool = (targetSchool || targetUniversity || 'ĐH Quy Nhơn').trim()

      const userProfile = {
        hollandCode: effectiveCode,
        targetMajor: targetMajor.trim(),
        targetSchool: finalSchool,
        reason: reason.trim(),
        initialConfidence: Number(confidenceScore),
        expectedIncome: expectedIncome
      }

      const rawCodes = effectiveCode.split('').filter(c => ['R','I','A','S','E','C'].includes(c))
      const compatStatus = getCompatibilitySummary(userProfile.targetMajor, rawCodes)
      const analysisText = analyzeHollandCompatibility(userProfile.targetMajor, rawCodes)

      const userAnchorData = {
        target_career: userProfile.targetMajor,
        target_university: userProfile.targetSchool,
        source_of_influence: userProfile.reason,
        confidence_score: String(userProfile.initialConfidence),
        expected_income: userProfile.expectedIncome,
        holland_codes: rawCodes,
        holland_code: effectiveCode,
        compatibility_status: compatStatus,
        holland_analysis: analysisText
      }

      // Lưu vào LocalStorage
      localStorage.setItem("cbas_user_profile", JSON.stringify(userProfile))
      localStorage.setItem("userAnchorData", JSON.stringify(userAnchorData))
      localStorage.setItem("cbas_anchor_data", JSON.stringify(userAnchorData))
      localStorage.setItem('career_initial_anchor', JSON.stringify({
        ...userProfile,
        target_major: userProfile.targetMajor,
        target_university: userProfile.targetSchool,
        choice_source: userProfile.reason,
        confidence_score_initial: userProfile.initialConfidence,
        expected_income: userProfile.expectedIncome,
        primary_code: effectiveCode,
        scores,
        compatibility_status: compatStatus,
        holland_analysis: analysisText
      }))

      // Lưu vào CSDL Supabase (nếu có kết nối)
      try {
        if (user) {
          await supabase.from('test_results').insert({
            student_id: user.id,
            scores_json: scores,
            primary_code: effectiveCode,
            recommended_majors_json: [userProfile.targetMajor]
          })
        }
      } catch (dbErr) {
        console.warn('Lưu CSDL Supabase (sẽ dùng bộ nhớ offline):', dbErr)
      }

      setResult({
        scores,
        primaryCode: effectiveCode,
        anchorData: {
          ...userProfile,
          target_major: userProfile.targetMajor,
          target_university: userProfile.targetSchool,
          choice_source: userProfile.reason,
          confidence_score_initial: userProfile.initialConfidence,
          scores
        }
      })
      setStepPhase('result')
      setToast({ type: 'success', message: '🎉 Đã hoàn tất Bước 1! Hệ thống đã đối chiếu phát hiện mâu thuẫn nhận thức.' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error('Lỗi nộp bài trắc nghiệm:', error)
      setToast({ type: 'error', message: 'Có lỗi xảy ra khi tính kết quả. Vui lòng thử lại!' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Chuyển sang Bước 2 (AI Tham vấn phản tư Socrates)
  const saveStep1DataAndNext = (customRedirectUrl = '/student/debias-agent') => {
    const { scores, primaryCode } = calculateRiasecCode()
    const effectiveCode = primaryCode || calculatedRiasecCode || result?.primaryCode || "AEI"
    const finalMajor = targetMajor.trim() || "Sư phạm"
    const finalSchool = (targetSchool || targetUniversity || "ĐH Quy Nhơn").trim()
    const finalReason = reason.trim() || "Em thích từ nhỏ"

    const userProfile = {
      hollandCode: effectiveCode,
      targetMajor: finalMajor,
      targetSchool: finalSchool,
      reason: finalReason,
      initialConfidence: Number(confidenceScore),
      expectedIncome: expectedIncome || "15 - 20 triệu/tháng"
    }

    const rawCodes = effectiveCode.split('').filter(c => ['R','I','A','S','E','C'].includes(c))
    const analysisText = analyzeHollandCompatibility(finalMajor, rawCodes)
    const compatStatus = getCompatibilitySummary(finalMajor, rawCodes)

    const userAnchorData = {
      target_career: finalMajor,
      target_university: finalSchool,
      source_of_influence: finalReason,
      confidence_score: String(userProfile.initialConfidence),
      expected_income: userProfile.expectedIncome,
      holland_codes: rawCodes,
      holland_code: effectiveCode,
      compatibility_status: compatStatus,
      holland_analysis: analysisText
    }

    // Lưu đồng bộ các key LocalStorage cho Bước 2 và toàn hệ thống
    localStorage.setItem("cbas_user_profile", JSON.stringify(userProfile))
    localStorage.setItem("userAnchorData", JSON.stringify(userAnchorData))
    localStorage.setItem("cbas_anchor_data", JSON.stringify(userAnchorData))
    localStorage.setItem("career_initial_anchor", JSON.stringify({
      ...userProfile,
      target_major: finalMajor,
      target_university: finalSchool,
      choice_source: finalReason,
      confidence_score_initial: userProfile.initialConfidence,
      expected_income: userProfile.expectedIncome,
      holland_codes: rawCodes,
      holland_code: effectiveCode,
      primary_code: effectiveCode,
      scores: result?.scores || scores,
      compatibility_status: compatStatus,
      holland_analysis: analysisText
    }))

    if (customRedirectUrl.startsWith('http')) {
      window.location.href = customRedirectUrl
    } else {
      navigate(customRedirectUrl)
    }
  }

  // CÁC HÀM ĐIỀU HƯỚNG VÀ LÀM LẠI
  const handleEditAnchor = () => {
    setStepPhase('anchor')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleResetQuiz = () => {
    setResult(null)
    setCurrentPage(0)
    const initialAnswers = {}
    questions.forEach(q => { initialAnswers[q.id] = null })
    setAnswers(initialAnswers)
    setStepPhase('quiz')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setToast({ type: 'info', message: 'Em đang làm lại 30 câu hỏi trắc nghiệm RIASEC.' })
  }

  const handleResetAll = () => {
    try {
      localStorage.removeItem('cbas_user_profile')
      localStorage.removeItem('userAnchorData')
      localStorage.removeItem('cbas_anchor_data')
      localStorage.removeItem('career_initial_anchor')
    } catch (e) {}
    setTargetMajor('')
    setTargetSchool('')
    setTargetUniversity('')
    setReason('')
    setConfidenceScore(7)
    setExpectedIncome('')
    setCalculatedRiasecCode('')
    setResult(null)
    setCurrentPage(0)
    const initialAnswers = {}
    questions.forEach(q => { initialAnswers[q.id] = null })
    setAnswers(initialAnswers)
    setStepPhase('anchor')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setToast({ type: 'info', message: 'Đã thiết lập lại Bước 1. Em hãy bắt đầu bằng việc khai báo mỏ neo chủ quan T₀!' })
  }

  const getHollandDescription = (code) => {
    const descriptions = {
      R: 'Kỹ thuật (Realistic): Khéo tay, thích làm việc thực tế với máy móc, công cụ, vật liệu hoặc môi trường tự nhiên.',
      I: 'Nghiên cứu (Investigative): Tư duy logic, thích quan sát, phân tích số liệu và giải quyết bài toán phức tạp.',
      A: 'Nghệ thuật (Artistic): Sáng tạo, độc lập, nhạy cảm thẩm mỹ, thích tự do thể hiện bản thân.',
      S: 'Xã hội (Social): Thích giao tiếp, lắng nghe, chăm sóc, chia sẻ và giúp đỡ mọi người phát triển.',
      E: 'Quản lý (Enterprising): Năng động, thích đàm phán, thuyết phục, lãnh đạo và hướng đến kết quả cụ thể.',
      C: 'Nghiệp vụ (Conventional): Cẩn thận, chi tiết, thích làm việc có quy trình, sắp xếp hệ thống số liệu rõ ràng.'
    }
    return code.split('').map(c => descriptions[c] || c)
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 w-64 rounded-sm"></div>
        <div className="h-4 bg-slate-200 w-full rounded-sm"></div>
        <div className="space-y-4 pt-6">
          <div className="h-20 bg-slate-200 rounded-sm"></div>
          <div className="h-20 bg-slate-200 rounded-sm"></div>
          <div className="h-20 bg-slate-200 rounded-sm"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 animate-reveal">
      {/* THANH TIẾN TRÌNH 5 BƯỚC VISEF CBAS */}
      <StepProgressHeader 
        currentStep={1} 
        title="Bước 1: Trắc Nghiệm Thiên Hướng (Holland RIASEC) & Mỏ Neo T0" 
        subtitle="Ghi nhận xuất phát điểm nhận thức ban đầu (Initial Anchor) để tạo nguyên liệu cho AI phản biện ở bước sau." 
      />

      {/* KHUNG ĐỊNH HƯỚNG NGHIÊN CỨU CHUẨN VISEF 2026 (3 TRỤ CỘT CỐT LÕI) */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-sm shadow-md border-2 border-indigo-400/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 border border-indigo-400/40 rounded-sm text-indigo-300">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 block">
                QUY TRÌNH CAN THIỆP HÀNH VI CBAS (VISEF 2026)
              </span>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Bước 1 — Bộc lộ mỏ neo và Khảo sát thiên hướng ban đầu (T₀)
              </h2>
            </div>
          </div>
          <span className="self-start sm:self-auto text-[11px] font-bold px-2.5 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full">
            3 Trụ cột cốt lõi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          {/* TRỤ CỘT 1 */}
          <div 
            onClick={() => setStepPhase('anchor')}
            className={`p-3.5 rounded-sm border transition-all cursor-pointer ${
              stepPhase === 'anchor'
                ? 'bg-amber-950/70 border-amber-400 text-amber-100 ring-2 ring-amber-400/50 shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5 font-bold text-amber-300">
              <div className="flex items-center gap-1.5">
                <Anchor className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="text-[12px] font-black uppercase tracking-wide">Ghi nhận mỏ neo chủ quan</span>
              </div>
              {stepPhase === 'anchor' && (
                <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black">ĐANG MỞ</span>
              )}
            </div>
            <p className="text-[11.5px] leading-relaxed text-slate-200">
              Học sinh lập tức khai báo ngành nghề mục tiêu, mức thu nhập kỳ vọng và tự chấm điểm mức độ tự tin (<em>Conf</em>) trước khi tiếp cận bất kỳ thông tin nào khác.
            </p>
          </div>

          {/* TRỤ CỘT 2 */}
          <div 
            onClick={() => setStepPhase('quiz')}
            className={`p-3.5 rounded-sm border transition-all cursor-pointer ${
              stepPhase === 'quiz'
                ? 'bg-emerald-950/70 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400/50 shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5 font-bold text-emerald-300">
              <div className="flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="text-[12px] font-black uppercase tracking-wide">Khảo sát thiên hướng khách quan</span>
              </div>
              {stepPhase === 'quiz' && (
                <span className="text-[9px] bg-emerald-400 text-slate-950 px-1.5 py-0.2 rounded font-black">ĐANG MỞ</span>
              )}
            </div>
            <p className="text-[11.5px] leading-relaxed text-slate-200">
              Thực hiện bài trắc nghiệm sở thích nghề nghiệp RIASEC (theo mô hình Holland chuẩn hóa gồm 30 câu hỏi) để xác định mã thiên hướng tự nhiên của học sinh.
            </p>
          </div>

          {/* TRỤ CỘT 3 */}
          <div 
            onClick={() => {
              if (result) {
                setStepPhase('result')
              } else {
                setToast({ type: 'warning', message: 'Vui lòng hoàn thành trắc nghiệm để mở Trụ cột 3!' })
              }
            }}
            className={`p-3.5 rounded-sm border transition-all ${result ? 'cursor-pointer' : 'opacity-85'} ${
              stepPhase === 'result'
                ? 'bg-sky-950/70 border-sky-400 text-sky-100 ring-2 ring-sky-400/50 shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5 font-bold text-sky-300">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 shrink-0 text-sky-400" />
                <span className="text-[12px] font-black uppercase tracking-wide">Phát hiện mâu thuẫn nhận thức</span>
              </div>
              {stepPhase === 'result' && (
                <span className="text-[9px] bg-sky-400 text-slate-950 px-1.5 py-0.2 rounded font-black">ĐANG MỞ</span>
              )}
            </div>
            <p className="text-[11.5px] leading-relaxed text-slate-200">
              Hệ thống đối chiếu chéo giữa ngành mơ ước ban đầu và mã RIASEC thực tế, tạo lập cơ sở dữ liệu xung đột phục vụ truy vấn phản tư tại Bước 2.
            </p>
          </div>
        </div>
      </div>

      {/* THANH CHUYỂN ĐỔI 3 GIAI ĐOẠN TRONG BƯỚC 1 (SUB-STEP PILLS SWITCHER) */}
      <div className="bg-white border border-slate-200 p-2.5 rounded-sm shadow-2xs flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setStepPhase('anchor')}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              stepPhase === 'anchor'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Anchor className="w-3.5 h-3.5" />
            <span>1. Mỏ neo chủ quan (T₀)</span>
          </button>

          <button
            type="button"
            onClick={() => setStepPhase('quiz')}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              stepPhase === 'quiz'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>2. Trắc nghiệm 30 câu RIASEC</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black">
              {answeredCount}/30
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (result) {
                setStepPhase('result')
              } else {
                setToast({ type: 'warning', message: 'Vui lòng hoàn thành 30 câu hỏi trắc nghiệm để mở Giai đoạn 3!' })
              }
            }}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              stepPhase === 'result'
                ? 'bg-sky-600 text-white shadow-xs'
                : result
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. Mâu thuẫn nhận thức & Kết quả</span>
            {result && <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-black">✓ Có sẵn</span>}
          </button>
        </div>

        <div className="text-right text-[11px] font-bold text-slate-500 px-2">
          {stepPhase === 'anchor' && '🎯 Chặng 1/3: Khai báo mỏ neo T₀'}
          {stepPhase === 'quiz' && `📋 Chặng 2/3: Câu ${currentPage * 5 + 1} - ${Math.min((currentPage + 1) * 5, 30)}/30`}
          {stepPhase === 'result' && '⚡ Chặng 3/3: Đối chiếu & Chuyển tiếp'}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GIAI ĐOẠN 1: BỘC LỘ MỎ NEO CHỦ QUAN (T0)                                   */}
      {/* ========================================================================= */}
      {stepPhase === 'anchor' && (
        <div className="bg-white border-2 border-amber-300 p-6 rounded-sm space-y-6 shadow-sm animate-reveal">
          <div className="border-b border-amber-200 pb-3 flex items-start gap-3 text-amber-950">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-sm shrink-0 mt-0.5">
              <Anchor className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                GIAI ĐOẠN 1: BỘC LỘ MỎ NEO CHỦ QUAN (T₀) — VISEF 2026
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Khai báo Ngành nghề mục tiêu, Kỳ vọng thu nhập & Tự chấm điểm tự tin (Conf)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Học sinh lập tức khai báo ngành nghề mục tiêu, mức thu nhập kỳ vọng và tự chấm điểm mức độ tự tin (<em>Conf</em>) trước khi tiếp cận bất kỳ thông tin nào khác.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* TRƯỜNG 1: NGÀNH NGHỀ & TRƯỜNG MỤC TIÊU */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-sm border border-slate-200">
              <label className="text-xs font-bold text-slate-800 block">
                1. Ngành nghề & Trường đại học mục tiêu: <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    id="targetCareerInput"
                    type="text"
                    required
                    value={targetMajor}
                    onChange={(e) => setTargetMajor(e.target.value)}
                    placeholder="Ví dụ: Sư phạm, Công nghệ thông tin..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-sm focus:border-brand-500 focus:outline-none bg-white font-medium"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Tên ngành nghề mục tiêu</span>
                </div>
                <div>
                  <input
                    id="targetUniversityInput"
                    type="text"
                    required
                    value={targetSchool}
                    onChange={(e) => {
                      setTargetSchool(e.target.value)
                      setTargetUniversity(e.target.value)
                    }}
                    placeholder="Ví dụ: ĐH Quy Nhơn, ĐH Bách Khoa..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-sm focus:border-brand-500 focus:outline-none bg-white font-medium"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Trường đại học mục tiêu</span>
                </div>
              </div>

              {/* Chips gợi ý nhanh */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                <span className="text-slate-500 font-semibold text-[10px]">Gợi ý nhanh:</span>
                {[
                  { major: 'Sư phạm', school: 'ĐH Quy Nhơn', label: 'Sư phạm - ĐH Quy Nhơn' },
                  { major: 'Công nghệ thông tin', school: 'ĐH Bách Khoa', label: 'CNTT - ĐH Bách Khoa' },
                  { major: 'Quản trị kinh doanh', school: 'ĐH Kinh tế TP.HCM', label: 'Kinh tế - ĐH Kinh tế TP.HCM' },
                  { major: 'Ngôn ngữ Anh', school: 'ĐH Ngoại ngữ', label: 'Ngôn ngữ Anh - ĐH Ngoại ngữ' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTargetMajor(item.major)
                      setTargetSchool(item.school)
                      setTargetUniversity(item.school)
                    }}
                    className="px-2 py-1 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 rounded text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TRƯỜNG 2: LÝ DO CHỌN NGÀNH */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-sm border border-slate-200">
              <label className="text-xs font-bold text-slate-800 block">
                2. Lý do em chọn ngành này: <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="reasonInput"
                required
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ví dụ: Em thích từ nhỏ, Mẹ định hướng, Thấy trên mạng bảo lương cao và nhiều cơ hội việc làm..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-sm focus:border-brand-500 focus:outline-none bg-white font-medium"
              />
              {/* Chips gợi ý nhanh lý do */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="text-slate-500 font-semibold text-[10px]">Chọn nhanh lý do:</span>
                {[
                  'Em thích từ nhỏ',
                  'Mẹ định hướng',
                  'Thấy trên mạng bảo lương cao',
                  'Bạn bè cùng rủ chọn',
                  'Mong muốn có việc làm và thu nhập ổn định'
                ].map((txt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReason(txt)}
                    className={`px-2 py-1 rounded text-[11px] border font-medium transition-colors cursor-pointer ${
                      reason === txt 
                        ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>

            {/* TRƯỜNG 3: MỨC ĐỘ TỰ TIN TRÚNG TUYỂN VÀ THEO NGHÈ (THANG ĐO T0) */}
            <div className="space-y-2.5 bg-slate-50 p-4 rounded-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  3. Mức độ tự tin trúng tuyển và theo nghề (Thang đo T0: 1 - 10 điểm): <span className="text-rose-500">*</span>
                </label>
                <span className="text-sm font-black px-2.5 py-0.5 rounded-sm bg-brand-600 text-white">
                  {confidenceScore} / 10 điểm
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Đánh giá mức độ tự tin hiện tại của em trước khi tiếp cận bất kỳ thông tin nào khác:
              </p>

              {/* Slider tương tác */}
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={confidenceScore}
                onChange={(e) => setConfidenceScore(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />

              {/* 10 nút bấm chọn điểm 1-10 */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                  const isSelected = confidenceScore === score
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setConfidenceScore(score)}
                      className={`py-2 text-xs font-black rounded-sm border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-sm scale-105' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-300'
                      }`}
                    >
                      {score}
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-1 pt-1">
                <span>1: Rất phân vân, lo lắng</span>
                <span>5: Tương đối tự tin</span>
                <span>10: Tuyệt đối tự tin</span>
              </div>
            </div>

            {/* TRƯỜNG 4: KỲ VỌNG MỨC THU NHẬP KHỞI ĐIỂM SAU KHI RA TRƯỜNG */}
            <div className="space-y-2.5 bg-slate-50 p-4 rounded-sm border border-slate-200">
              <label className="text-xs font-bold text-slate-800 block">
                4. Kỳ vọng mức thu nhập khởi điểm sau khi ra trường: <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { value: 'Dưới 10 triệu/tháng', label: '💵 Dưới 10 triệu/tháng' },
                  { value: '10 - 15 triệu/tháng', label: '💰 10 - 15 triệu/tháng' },
                  { value: '15 - 20 triệu/tháng', label: '💎 15 - 20 triệu/tháng' },
                  { value: 'Trên 20 triệu/tháng', label: '🚀 Trên 20 triệu/tháng' }
                ].map((item) => (
                  <label
                    key={item.value}
                    className={`flex items-center gap-2 p-2.5 rounded-sm border cursor-pointer transition-all ${
                      expectedIncome === item.value 
                        ? 'bg-emerald-100/80 border-emerald-500 text-emerald-950 font-bold' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="expected_income"
                      value={item.value}
                      checked={expectedIncome === item.value}
                      onChange={() => setExpectedIncome(item.value)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Hidden inputs phục vụ DOM retrieval chuẩn xác theo ID */}
            <input type="hidden" id="influenceSourceInput" value={reason} />
            <input type="hidden" id="confidenceScoreInput" value={String(confidenceScore)} />
            <input type="hidden" id="hollandResultText" value={calculatedRiasecCode || result?.primaryCode || "AEI"} />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <span className="text-xs text-slate-500 font-bold">
              🎯 Hoàn thành khai báo mỏ neo chủ quan để bắt đầu 30 câu hỏi RIASEC
            </span>
            <button
              type="button"
              onClick={handleConfirmAnchor}
              className="w-full sm:w-auto py-2.5 px-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Xác nhận Mỏ neo T₀ ➔ Tiếp tục: Khảo sát RIASEC (30 câu)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GIAI ĐOẠN 2: KHẢO SÁT THIÊN HƯỚNG KHÁCH QUAN (RIASEC 30 CÂU)              */}
      {/* ========================================================================= */}
      {stepPhase === 'quiz' && (
        <div className="space-y-5 animate-reveal">
          {/* Banner thông báo giai đoạn 2 */}
          <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-950">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/80 px-2.5 py-0.5 rounded-full inline-block mb-1">
                GIAI ĐOẠN 2: KHẢO SÁT THIÊN HƯỚNG KHÁCH QUAN (RIASEC)
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                30 Câu Hỏi Trắc Nghiệm Sở Thích Nghề Nghiệp Holland Chuẩn Hóa
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Thực hiện bài trắc nghiệm sở thích nghề nghiệp RIASEC (30 câu hỏi) để xác định mã thiên hướng tự nhiên của học sinh.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-sm border border-emerald-200 shadow-2xs block">
                Đã trả lời: {answeredCount}/30 câu ({progressPercent}%)
              </span>
            </div>
          </div>

          {/* Thanh tiến trình */}
          <div className="bg-white border border-slate-200 p-4 rounded-sm space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Tiến trình trắc nghiệm 30 câu hỏi RIASEC</span>
              <span>
                Trang {currentPage + 1} / {totalQuestionPages} ({answeredCount}/30 câu)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${(answeredCount / 30) * 100}%` }}
              />
            </div>
          </div>

          {/* Danh sách 5 câu hỏi của trang */}
          <div className="space-y-4">
            {pageQuestions.map((q, idx) => {
              const globalIdx = currentPage * questionsPerPage + idx + 1
              return (
                <div 
                  key={q.id} 
                  className="bg-white border border-slate-200 p-5 rounded-sm space-y-3.5 hover:border-slate-300 transition-colors shadow-2xs"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center shrink-0 border border-slate-300">
                      {globalIdx}
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed pt-0.5">
                      {q.text}
                    </p>
                  </div>
                  
                  {/* 4 mức đo lường Likert */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 pl-8">
                    {[
                      { value: 1, label: '1. Rất không đúng' },
                      { value: 2, label: '2. Không đúng lắm' },
                      { value: 3, label: '3. Khá đúng' },
                      { value: 4, label: '4. Rất đúng' }
                    ].map((opt) => {
                      const isSelected = answers[q.id] === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleAnswerSelect(q.id, opt.value)}
                          className={`py-2 px-2.5 border text-xs font-bold rounded-sm transition-all focus:outline-none text-center cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Điều hướng trang câu hỏi */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button
              variant="secondary"
              onClick={handleBackQuizPage}
              className="text-xs font-bold uppercase tracking-wider gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentPage === 0 ? 'Quay lại Form Mỏ neo T₀' : 'Trang trước'}
            </Button>

            <span className="text-xs text-slate-500 font-bold">
              Trang {currentPage + 1} / {totalQuestionPages}
            </span>

            {currentPage === totalQuestionPages - 1 ? (
              <button
                type="button"
                onClick={handleSubmitQuizAndDetectConflict}
                disabled={isSubmitting}
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Đang xử lý kết quả...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Hoàn thành 30 câu & Đối chiếu Mâu thuẫn nhận thức ➔</span>
                  </>
                )}
              </button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNextQuizPage}
                className="text-xs font-bold uppercase tracking-wider gap-1.5"
              >
                Trang tiếp theo
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GIAI ĐOẠN 3: PHÁT HIỆN MÂU THUẪN NHẬN THỨC & ĐỐI CHIẾU KẾT QUẢ              */}
      {/* ========================================================================= */}
      {stepPhase === 'result' && result && (
        <div className="space-y-6 animate-reveal">
          {/* Banner Chúc Mừng & Tóm Tắt Bước 1 */}
          <div className="bg-emerald-50 border-2 border-emerald-300 p-6 rounded-sm text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full">
                BƯỚC 1: XÁC LẬP XUẤT PHÁT ĐIỂM NHẬN THỨC THÀNH CÔNG
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Đã ghi nhận Mỏ neo nhận thức & Kết quả Holland thành công!
              </h1>
              <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
                Mã thiên hướng và mỏ neo ban đầu của bạn đã sẵn sàng. Dữ liệu này sẽ được nạp thẳng vào AI Phản tư ở Bước 2 để chất vấn sâu các điểm mù.
              </p>
            </div>
          </div>

          {/* THẺ TÓM TẮT MỎ NEO NHẬN THỨC (INITIAL ANCHOR SUMMARY) */}
          <div className="bg-amber-50/90 border-2 border-amber-300 p-5 rounded-sm shadow-xs space-y-3 text-amber-950">
            <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
              <Anchor className="w-5 h-5 text-amber-600" />
              <h3 className="font-extrabold text-xs sm:text-sm text-amber-950 uppercase tracking-wider">
                ⚓ MỎ NEO NHẬN THỨC BAN ĐẦU (INITIAL ANCHOR T₀) ĐÃ THIẾT LẬP
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-sm border border-amber-200 space-y-1">
                <span className="text-slate-500 font-semibold block text-[11px]">Ngành & Trường mục tiêu:</span>
                <p className="font-bold text-slate-900 text-sm">{result.anchorData.target_major || targetMajor}</p>
                <p className="text-slate-600 text-[11px]">{result.anchorData.target_university || targetSchool}</p>
              </div>
              <div className="bg-white p-3 rounded-sm border border-amber-200 space-y-1">
                <span className="text-slate-500 font-semibold block text-[11px]">Nguồn gợi mở chọn nghề:</span>
                <p className="font-bold text-amber-800 text-xs">{result.anchorData.choice_source || reason}</p>
              </div>
              <div className="bg-white p-3 rounded-sm border border-amber-200 space-y-1">
                <span className="text-slate-500 font-semibold block text-[11px]">Độ tự tin ban đầu (Conf):</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-brand-600">{result.anchorData.confidence_score_initial || confidenceScore} / 10</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-bold bg-brand-100 text-brand-800">
                    {(result.anchorData.confidence_score_initial || confidenceScore) >= 8 ? 'Tự tin cao' : 'Khá tự tin'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PHÂN TÍCH RIASEC: BIỂU ĐỒ RADAR KHÔNG MẤT CHỮ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="bg-white border border-slate-200 p-5 rounded-sm space-y-3 shadow-xs">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                Biểu đồ 6 nhóm tính cách Holland
              </h3>
              <HollandChart scores={result.scores} type="radar" />
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-sm space-y-4 shadow-xs">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Mã Holland 3 nhóm nổi trội</span>
                <p className="text-3xl font-black text-brand-600 tracking-tight mt-1">{result.primaryCode}</p>
              </div>
              <div className="space-y-2 pt-1 border-t border-slate-100">
                {getHollandDescription(result.primaryCode).map((desc, idx) => (
                  <p key={idx} className="text-xs text-slate-700 leading-relaxed font-medium">
                    • {desc}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* KHUNG ĐẶC BIỆT: ⚡ TRỤ CỘT 3: PHÁT HIỆN MÂU THUẪN NHẬN THỨC (COGNITIVE CONFLICT DETECTION) */}
          <div className="bg-sky-50 border-2 border-sky-400 p-5 sm:p-6 rounded-sm shadow-sm space-y-4 text-sky-950">
            <div className="flex items-center gap-2.5 border-b border-sky-200 pb-3">
              <div className="p-2 bg-sky-200 text-sky-800 rounded-sm">
                <Sparkles className="w-5 h-5 text-sky-700" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 block">
                  TRỤ CỘT 3: CƠ SỞ DỮ LIỆU XUNG ĐỘT (CBAS VISEF 2026)
                </span>
                <h3 className="font-black text-sm sm:text-base text-slate-900">
                  Phát Hiện Mâu Thuẫn Nhận Thức Giữa Mỏ Neo Chủ Quan Và Thiên Hướng Khách Quan
                </h3>
              </div>
            </div>

            <p className="text-xs text-sky-900 leading-relaxed font-semibold">
              Hệ thống đối chiếu chéo giữa ngành mơ ước ban đầu và mã RIASEC thực tế, tạo lập cơ sở dữ liệu xung đột phục vụ truy vấn phản tư tại Bước 2.
            </p>

            {/* Bảng đối chiếu chéo 2 chiều */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="bg-white p-4 rounded border border-sky-200 space-y-2 shadow-2xs">
                <span className="text-amber-800 font-black text-[11px] block uppercase tracking-wide">
                  ⚓ Mỏ neo chủ quan ban đầu (T₀)
                </span>
                <p className="text-slate-900 font-bold text-sm">
                  {result?.anchorData?.target_major || targetMajor} ({result?.anchorData?.target_university || targetSchool})
                </p>
                <div className="space-y-1 text-slate-600 text-[11.5px] border-t border-slate-100 pt-1.5">
                  <p>• <strong>Động cơ lựa chọn:</strong> "{result?.anchorData?.choice_source || reason}"</p>
                  <p>• <strong>Độ tự tin khởi điểm (Conf):</strong> <span className="font-black text-brand-700">{result?.anchorData?.confidence_score_initial || confidenceScore}/10</span></p>
                  <p>• <strong>Kỳ vọng thu nhập:</strong> {result?.anchorData?.expected_income || expectedIncome}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded border border-sky-200 space-y-2 shadow-2xs">
                <span className="text-emerald-800 font-black text-[11px] block uppercase tracking-wide">
                  🧭 Thiên hướng khách quan đo lường (RIASEC)
                </span>
                <p className="text-emerald-700 font-black text-base tracking-wider">
                  Mã 3 chữ cái: {result?.primaryCode || calculatedRiasecCode || 'AEI'}
                </p>
                <div className="space-y-1 text-slate-600 text-[11.5px] border-t border-slate-100 pt-1.5 leading-relaxed">
                  <p>+ <strong>Chủ đạo ({result.primaryCode[0]}):</strong> {hollandDescriptions[result.primaryCode[0]]}</p>
                  {result.primaryCode[1] && (
                    <p>+ <strong>Bổ trợ ({result.primaryCode[1]}):</strong> {hollandDescriptions[result.primaryCode[1]]}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Đánh giá độ tương thích & Cảnh báo độ vênh nhận thức (Hệ thống Khoa học Hành vi ViSEF CBAS 2026) */}
            {(() => {
              const initialAnchorMajor = result?.anchorData?.target_major || result?.anchorData?.target_career || targetMajor || 'Sư phạm';
              const effectiveMajor = activeCompareMajor || initialAnchorMajor;
              const userRiasecArray = (result?.primaryCode || calculatedRiasecCode || 'AEI').split('').filter(c => ['R','I','A','S','E','C'].includes(c));
              const evalData = evaluateHollandCompatibility(effectiveMajor, userRiasecArray);
              const isCustomComparing = activeCompareMajor && activeCompareMajor.trim().toLowerCase() !== initialAnchorMajor.trim().toLowerCase();

              const sampleMajors = [
                'Công nghệ thông tin',
                'Quản trị kinh doanh',
                'Kế toán - Kiểm toán',
                'Sư phạm',
                'Y đa khoa',
                'Thiết kế đồ họa',
                'Ngôn ngữ Anh',
                'Luật kinh tế'
              ];

              return (
                <div id="compatibility-result-card" className="bg-white rounded-lg border-2 border-sky-300 text-xs shadow-xs overflow-hidden space-y-4 p-4 sm:p-5 scroll-mt-6">
                  {/* HEADER KHỐI ĐÁNH GIÁ */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-sky-100 text-sky-800">
                        <Scale className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                          Đánh Giá Độ Tương Thích RIASEC & Điểm Mù Nhận Thức
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Đối chiếu thiên hướng tính cách tự nhiên với đòi hỏi môi trường thực tế của nghề
                        </p>
                      </div>
                    </div>

                    {isCustomComparing && (
                      <button 
                        type="button"
                        onClick={() => handleResetToInitialMajor(initialAnchorMajor)}
                        className="self-start sm:self-auto text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-500" />
                        Khôi phục ngành gốc ({initialAnchorMajor})
                      </button>
                    )}
                  </div>

                  {/* THẺ ĐIỂM SỐ & TRẠNG THÁI TƯƠNG THÍCH CHÍNH */}
                  <div className={`p-4 rounded-lg border transition-all ${
                    evalData.level === 'high' 
                      ? 'bg-emerald-50/60 border-emerald-300' 
                      : evalData.level === 'low' 
                        ? 'bg-rose-50/60 border-rose-300' 
                        : 'bg-amber-50/60 border-amber-300'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-600">
                            Ngành đang đối chiếu:
                          </span>
                          <span className="font-black text-slate-900 text-base">
                            "{effectiveMajor}"
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                            {evalData.profile.categoryName}
                          </span>
                          {isCustomComparing && (
                            <span className="text-[10px] px-2 py-0.5 rounded font-black bg-sky-100 text-sky-800 border border-sky-200">
                              CHẾ ĐỘ THỬ NGHIỆM
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {evalData.levelSummary}
                        </p>
                      </div>

                      {/* Badge Điểm số lớn */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Độ phù hợp</span>
                          <div className={`text-2xl sm:text-3xl font-black ${
                            evalData.level === 'high' ? 'text-emerald-700' : evalData.level === 'low' ? 'text-rose-700' : 'text-amber-700'
                          }`}>
                            {evalData.compatibilityScore}%
                          </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg border text-xs font-black flex items-center gap-1.5 shadow-2xs ${
                          evalData.level === 'high' 
                            ? 'bg-emerald-600 text-white border-emerald-700' 
                            : evalData.level === 'low' 
                              ? 'bg-rose-600 text-white border-rose-700' 
                              : 'bg-amber-500 text-white border-amber-600'
                        }`}>
                          {evalData.level === 'high' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          <span>{evalData.levelLabel.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Thanh tiến trình phần trăm */}
                    <div className="mt-3 w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          evalData.level === 'high' ? 'bg-emerald-600' : evalData.level === 'low' ? 'bg-rose-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${evalData.compatibilityScore}%` }}
                      />
                    </div>
                  </div>

                  {/* BẢNG ĐỐI CHIẾU CHÉO 2 CỘT SONG SONG */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Cột 1: Học sinh */}
                    <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                          🧭 Thiên hướng của em:
                        </span>
                        <span className="font-black text-emerald-700 text-sm tracking-widest bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200">
                          {evalData.userCodes.join(' - ')}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-[11.5px] text-slate-600 leading-relaxed">
                        <p>• <strong>Chủ đạo ({evalData.userCodes[0]}):</strong> {hollandDescriptions[evalData.userCodes[0]]}</p>
                        {evalData.userCodes[1] && (
                          <p>• <strong>Bổ trợ ({evalData.userCodes[1]}):</strong> {hollandDescriptions[evalData.userCodes[1]]}</p>
                        )}
                        {evalData.userCodes[2] && (
                          <p>• <strong>Hỗ trợ ({evalData.userCodes[2]}):</strong> {hollandDescriptions[evalData.userCodes[2]]}</p>
                        )}
                      </div>
                      <div className="pt-2 border-t border-slate-200/70">
                        {evalData.matchedCodes.length > 0 ? (
                          <div className="text-[11.5px] text-emerald-900 bg-emerald-100/60 p-2 rounded border border-emerald-200 font-medium">
                            ✓ <strong>Tố chất tự nhiên phù hợp nghề:</strong> [{evalData.matchedCodes.join(', ')}] ({evalData.matchedCodes.map(c => hollandDescriptions[c]?.split(' ')[0] || c).join(', ')})
                          </div>
                        ) : (
                          <div className="text-[11.5px] text-slate-500 italic bg-white p-2 rounded border border-slate-200">
                            Không có mã trùng khớp trực tiếp với nhóm chủ lực của nghề.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cột 2: Đòi hỏi của nghề */}
                    <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                          💼 Đòi hỏi môi trường nghề:
                        </span>
                        <span className="font-black text-sky-800 text-sm tracking-widest bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
                          {evalData.targetCodes.join(' - ')}
                        </span>
                      </div>
                      <div className="space-y-1 text-[11.5px] text-slate-600 leading-relaxed">
                        <p>• <strong>Môi trường hàng ngày:</strong> {evalData.profile.workEnvironment}</p>
                        <p>• <strong>Năng lực cốt lõi:</strong> {evalData.profile.coreSkills}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-200/70">
                        {evalData.gapCodes.length > 0 ? (
                          <div className="text-[11.5px] text-amber-950 bg-amber-100/70 p-2 rounded border border-amber-300 font-medium">
                            ⚠️ <strong>Thách thức thích ứng:</strong> Nghề đòi hỏi cao nhóm [{evalData.gapCodes.join(', ')}] - tính cách mà em chưa thể hiện rõ ở bài trắc nghiệm.
                          </div>
                        ) : (
                          <div className="text-[11.5px] text-emerald-900 bg-emerald-100/60 p-2 rounded border border-emerald-200 font-medium">
                            ✓ Ngành này không đòi hỏi nhóm tính cách nào xung đột lớn với em.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* KHỐI BÓC TÁCH ĐIỂM MÙ NHẬN THỨC */}
                  <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-3.5 space-y-1.5 text-slate-800">
                    <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>CẢNH BÁO ĐIỂM MÙ NHẬN THỨC & BẪY TÂM LÝ THƯỜNG GẶP:</span>
                    </div>
                    <p className="text-slate-700 text-[11.5px] leading-relaxed font-medium pl-5">
                      {evalData.profile.commonBlindSpots}
                    </p>
                  </div>

                  {/* KHỐI HẠT GIỐNG ĐỐI CHẤT CHO BƯỚC 2 (AI SOCRATES) */}
                  <div className="bg-slate-900 text-white rounded-lg p-3.5 space-y-2 border border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-amber-500/20 text-amber-400">
                        <Bot className="w-4 h-4" />
                      </div>
                      <span className="font-black text-amber-300 text-xs uppercase tracking-wide">
                        CƠ SỞ DỮ LIỆU ĐỐI CHẤT CHO BƯỚC 2 (AI SOCRATES):
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Dữ liệu vênh nhận thức này được nạp tự động sang <strong>AI Phản Tư Socrates</strong>. Ở Bước 2, AI sẽ đặt cho em những câu hỏi chất vấn sâu sắc sau:
                    </p>
                    <div className="space-y-1.5 pl-2 border-l-2 border-amber-400/60 my-1">
                      {evalData.profile.socraticQuestions.map((q, qIdx) => (
                        <p key={qIdx} className="text-[11.5px] text-slate-200 italic font-medium">
                          ❓ "{q}"
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* BỘ CÔNG CỤ TƯƠNG TÁC: ĐỐI CHIẾU THỬ NGHIỆM NGÀNH KHÁC */}
                  <div className="bg-sky-50/60 border border-sky-200 rounded-lg p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-extrabold text-sky-950 text-xs flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-sky-700" />
                        Thử nghiệm đối chiếu mã Holland [{evalData.userCodes.join('')}] với các ngành nghề khác:
                      </span>
                      {isCustomComparing && (
                        <button
                          type="button"
                          onClick={() => handleResetToInitialMajor(initialAnchorMajor)}
                          className="text-[11px] text-sky-800 hover:text-sky-950 font-bold underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> Trở về ngành ban đầu
                        </button>
                      )}
                    </div>

                    {/* Chips ngành nghề mẫu */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {sampleMajors.map((m, mIdx) => {
                        const isCurrent = effectiveMajor.toLowerCase() === m.toLowerCase();
                        return (
                          <button
                            key={mIdx}
                            type="button"
                            onClick={() => handleSelectCompareMajor(m)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border cursor-pointer ${
                              isCurrent
                                ? 'bg-sky-600 text-white border-sky-700 shadow-xs ring-2 ring-sky-300'
                                : 'bg-white hover:bg-sky-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>

                    {/* Ô nhập ngành tùy ý & Nút đối chiếu ngay */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Hoặc gõ tên ngành bất kỳ (VD: Khoa học dữ liệu, Dược, Luật quốc tế, Vi mạch...)"
                        value={customCompareInput}
                        onChange={(e) => setCustomCompareInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSelectCompareMajor(customCompareInput.trim() || effectiveMajor);
                          }
                        }}
                        className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectCompareMajor(customCompareInput.trim() || effectiveMajor);
                        }}
                        className="px-3.5 py-1.5 bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white font-bold rounded text-xs transition-colors shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        Đối chiếu ngay
                      </button>
                    </div>

                    {/* THANH TRẠNG THÁI HIỂN THỊ TỨC THÌ (INSTANT STATUS BANNER) */}
                    <div className="mt-2 p-2.5 rounded-lg border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-semibold text-slate-500">Đang đối chiếu:</span>
                        <span className="font-black text-slate-900 text-xs sm:text-sm">"{effectiveMajor}"</span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                          evalData.level === 'high' 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : evalData.level === 'low' 
                              ? 'bg-rose-100 text-rose-800 border-rose-300' 
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {evalData.compatibilityScore}% • {evalData.levelLabel}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('compatibility-result-card');
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="text-xs text-sky-700 hover:text-sky-900 font-bold flex items-center gap-1 underline cursor-pointer self-start sm:self-auto"
                      >
                        <span>Xem bảng đối chiếu chi tiết ⬆</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* NÚT HÀNH ĐỘNG TIẾP THEO: SANG BƯỚC 2 */}
          <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-xl border border-slate-700/80 shadow-xl space-y-5">
            {/* Hàng trên: Tiêu đề & Thông điệp chuyển bước (Full Width) */}
            <div className="flex items-start gap-3.5 pb-4 border-b border-slate-800/80">
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5 shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                    Bước tiếp theo • 2 / 4
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Can thiệp phản tư hành vi (CBAS VISEF 2026)</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Sẵn sàng đối diện với phản biện Socrates từ AI?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  AI sẽ dùng chính mỏ neo ngành <strong className="text-amber-300">"{result?.anchorData?.target_major || targetMajor}"</strong> và mã thiên hướng <strong className="text-emerald-300">{result?.primaryCode || calculatedRiasecCode || 'RIASEC'}</strong> để chất vấn các điểm mù thực tế của bạn.
                </p>
              </div>
            </div>

            {/* Hàng dưới: Nhóm thao tác phụ và Nút hành động chính */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 pt-1">
              {/* Cụm thao tác xem lại / làm lại */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleEditAnchor}
                  className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  title="Chỉnh sửa lại ngành, trường, lý do chọn nghề mà không cần làm lại trắc nghiệm"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-300" />
                  <span>Chỉnh sửa Mỏ neo</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetQuiz}
                  className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  title="Làm lại 30 câu hỏi trắc nghiệm RIASEC"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Làm lại trắc nghiệm</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="px-3.5 py-2 bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 hover:text-rose-200 border border-rose-900/40 hover:border-rose-800/60 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Xóa kết quả trắc nghiệm và mỏ neo để làm lại từ đầu Bước 1"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Làm lại từ đầu</span>
                </button>
              </div>

              {/* Nút hành động chính: Chuyển sang Bước 2 */}
              <button
                type="button"
                onClick={() => saveStep1DataAndNext('/student/debias-agent')}
                className="py-3 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-lg transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.01] active:scale-[0.98] shrink-0"
              >
                <Bot className="w-4 h-4 text-slate-950 shrink-0" />
                <span>Hoàn Thành Bước 1 ➔ Sang Bước 2: AI Phản Tư Socrates</span>
                <ArrowRight className="w-4 h-4 text-slate-950 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default HollandTest
