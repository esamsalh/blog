function confirmDelete(msg) {
    return confirm(msg || 'هل أنت متأكد من الحذف؟');
}

function initLangTabs() {
    document.querySelectorAll('.lang-tabs').forEach(function(tabGroup) {
        var tabs = tabGroup.querySelectorAll('.lang-tab');
        var contents = document.querySelectorAll('.lang-content');
        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                var lang = this.getAttribute('data-lang');
                tabs.forEach(function(t) { t.classList.remove('active'); });
                this.classList.add('active');
                contents.forEach(function(c) {
                    c.classList.remove('active');
                    if (c.getAttribute('data-lang') === lang) {
                        c.classList.add('active');
                    }
                });
            });
        });
    });
}

function addFaqItem(container, data) {
    var idx = container.querySelectorAll('.faq-item-form').length;
    var html = '<div class="faq-item-form">';
    html += '<div class="lang-tabs">';
    html += '<button class="lang-tab active" data-lang="ar" type="button">العربية</button>';
    html += '<button class="lang-tab" data-lang="en" type="button">English</button>';
    html += '<button class="lang-tab" data-lang="fr" type="button">Français</button>';
    html += '</div>';
    html += '<div class="lang-content active" data-lang="ar">';
    html += '<div class="form-group"><label>السؤال (عربي)</label><input class="form-control" name="faq_question_ar[]" value="' + ((data && data.qa) || '') + '" required></div>';
    html += '<div class="form-group"><label>الإجابة (عربي)</label><textarea class="form-control" name="faq_answer_ar[]" rows="3" required>' + ((data && data.aa) || '') + '</textarea></div>';
    html += '</div>';
    html += '<div class="lang-content" data-lang="en">';
    html += '<div class="form-group"><label>Question (English)</label><input class="form-control" name="faq_question_en[]" value="' + ((data && data.qe) || '') + '"></div>';
    html += '<div class="form-group"><label>Answer (English)</label><textarea class="form-control" name="faq_answer_en[]" rows="3">' + ((data && data.ae) || '') + '</textarea></div>';
    html += '</div>';
    html += '<div class="lang-content" data-lang="fr">';
    html += '<div class="form-group"><label>Question (Français)</label><input class="form-control" name="faq_question_fr[]" value="' + ((data && data.qf) || '') + '"></div>';
    html += '<div class="form-group"><label>Réponse (Français)</label><textarea class="form-control" name="faq_answer_fr[]" rows="3">' + ((data && data.af) || '') + '</textarea></div>';
    html += '</div>';
    html += '<button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">حذف السؤال</button>';
    html += '</div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    container.appendChild(div.firstElementChild);
    initLangTabs();
}

document.addEventListener('DOMContentLoaded', function() {
    initLangTabs();
    var faqContainer = document.getElementById('faqContainer');
    if (faqContainer) {
        var addBtn = document.getElementById('addFaqBtn');
        if (addBtn) {
            addBtn.addEventListener('click', function() { addFaqItem(faqContainer); });
        }
    }
});
