export function validatePhone(phone) {
  if (!phone) return "请输入手机号";
  if (!/^1[3-9]\d{9}$/.test(phone)) return "手机号格式不正确，请输入11位手机号码";
  return null;
}

export function validateLeadForm(form, checkDuplicate, excludeId) {
  if (!form.name) return "请输入客户名称";
  const phoneErr = validatePhone(form.phone);
  if (phoneErr) return phoneErr;
  if (!form.assignedTo) return "请选择负责人";
  if (checkDuplicate && checkDuplicate(form.name, form.phone, excludeId)) {
    return "客户名称或手机号已存在";
  }
  return null;
}

export function validateAdvertiserForm(form) {
  if (!form.name) return "请输入客户名称";
  if (form.phone && !/^1[3-9]\d{9}$/.test(form.phone)) {
    return "手机号格式不正确，请输入11位手机号码";
  }
  return null;
}

export function validateFollowupForm(form) {
  if (!form.content) return "请输入跟进内容";
  return null;
}
