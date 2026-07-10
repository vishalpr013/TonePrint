# Toneprint Pilot Dataset — 9 training pairs + 3 transfer test requests
# Ported to Python for the FastAPI backend.

training_pairs = [
    # === PROFESSOR CONTEXT ===
    {
        "id": "professor-1",
        "context": "professor",
        "scenario": "late_submission",
        "request": "Tell my professor I'll submit the assignment two days late because my laptop crashed and I lost my work.",
        "aiDraft": """Dear Professor,

I hope this email finds you well. I am writing to sincerely apologize for the inconvenience, but unfortunately, I will not be able to submit the assignment by the deadline. My laptop experienced a critical failure, and I lost a significant portion of my work. I deeply regret any trouble this may cause you, and I completely understand if there are penalties involved. I am currently working diligently to redo the assignment and would be incredibly grateful if you could allow me to submit it two days after the original deadline. I truly appreciate your understanding and patience in this matter, and I assure you it will not happen again.

Sincerely,
[Your Name]""",
        "userEdit": """Hi Professor,

My laptop crashed and I lost my progress on the assignment. I'm redoing it now and can have it to you by Wednesday (two days past the deadline). Would that work, or is there a different process I should follow for late submissions?

Thanks,
[Your Name]"""
    },
    {
        "id": "professor-2",
        "context": "professor",
        "scenario": "recommendation_letter",
        "request": "Ask my professor if she'd be willing to write me a recommendation letter for grad school.",
        "aiDraft": """Dear Professor,

I hope you are doing well. I am reaching out to you today because I have a very important request. I am planning to apply to graduate school this fall, and I was wondering if you would be willing to write a letter of recommendation on my behalf. I have really enjoyed your classes and feel that I have learned a great deal from you. I believe that your perspective on my academic abilities would be very valuable for my applications. If this is something you would be comfortable doing, I would be more than happy to provide any materials or information that might be helpful. Please let me know at your earliest convenience whether this is possible.

Thank you so much for your time and consideration.

Best regards,
[Your Name]""",
        "userEdit": """Hi Professor,

I'm applying to MS programs in computational biology this fall (deadline: Dec 15). Would you be willing to write a recommendation letter? I took your Molecular Systems course (Spring '25, A) and worked on the protein folding project in your lab last summer.

I can send you my CV, statement of purpose, and a list of programs whenever it's convenient.

Thanks,
[Your Name]"""
    },
    {
        "id": "professor-3",
        "context": "professor",
        "scenario": "reschedule_office_hours",
        "request": "Ask my professor if I can come to office hours at a different time this week because I have a doctor's appointment.",
        "aiDraft": """Dear Professor,

I hope this message finds you well. I wanted to reach out to you regarding your office hours this week. Unfortunately, I have a previously scheduled doctor's appointment that conflicts with your regular office hours time. I have been meaning to come see you to discuss some questions I have about the recent lecture material, specifically regarding the concepts covered in Chapter 7. I was wondering if there might be any possibility of meeting at an alternative time this week. I am flexible and available most other days, so I would be happy to work around your schedule. I understand that you are very busy, and I apologize for the inconvenience of requesting a schedule change. Any time that works for you would be greatly appreciated.

Thank you for your understanding.

Best,
[Your Name]""",
        "userEdit": """Hi Professor,

I have a conflict during your office hours this week. Could I stop by at a different time? I'm free Monday after 2 or Thursday morning. I have questions about the Ch. 7 material.

Thanks,
[Your Name]"""
    },

    # === FRIEND CONTEXT ===
    {
        "id": "friend-1",
        "context": "friend",
        "scenario": "cancel_birthday",
        "request": "Tell my friend I can't make it to their birthday party this weekend because I have to study for finals.",
        "aiDraft": """Hey,

I hope you're doing well. I wanted to let you know that unfortunately, I will not be able to attend your birthday party this weekend. I have final exams coming up next week and I need to dedicate this weekend to studying. I feel really bad about missing your celebration and I sincerely apologize for the inconvenience. I hope you have a wonderful time and I would love to make it up to you afterwards. Please know that I will be thinking of you on your special day.

Best wishes,
[Your Name]""",
        "userEdit": """hey!! I'm SO bummed but I can't make it saturday — finals are next week and I'm drowning lol. Can we do dinner or something the week after to celebrate? I'll get you a drink 🎂

happy early birthday ❤️"""
    },
    {
        "id": "friend-2",
        "context": "friend",
        "scenario": "recommend_show",
        "request": "Tell my friend they should watch Severance, I just finished it.",
        "aiDraft": """Hey,

I just finished watching Severance and I wanted to recommend it to you. It's a really interesting show that I think you would enjoy. The premise is quite unique and the acting is excellent. The plot keeps you engaged throughout and there are many surprising twists. I believe it's available on Apple TV+. I would highly recommend giving it a try when you have some free time. Let me know if you end up watching it, as I would love to discuss it with you.

Talk soon!""",
        "userEdit": """dude you NEED to watch Severance. I just binged the whole thing and my brain is broken. it's like if The Office was a psychological thriller?? don't look anything up, just go in blind. trust me. apple tv. do it tonight."""
    },
    {
        "id": "friend-3",
        "context": "friend",
        "scenario": "help_moving",
        "request": "Ask my friend if they can help me move apartments next Saturday.",
        "aiDraft": """Hey,

I hope you're having a good week. I wanted to reach out because I have a bit of a favor to ask. I'm moving to a new apartment next Saturday and I was wondering if you might be available to help me out. I understand this is a big ask and I completely understand if you have other commitments. If you are available, I would really appreciate any help you could provide. I'm planning to start around 10 AM and I think it should take most of the day. Of course, I'll provide food and drinks for everyone who helps. Please let me know if this is something you'd be able to do.

Thanks so much!""",
        "userEdit": """hey, are you free next saturday? I'm moving to the new place and could really use an extra pair of arms. Starting around 10. I'll bribe you with pizza and beer obviously. No pressure if you can't tho!"""
    },

    # === PROFESSIONAL CONTEXT ===
    {
        "id": "professional-1",
        "context": "professional",
        "scenario": "job_followup",
        "request": "Follow up on the product manager application I submitted two weeks ago to Acme Corp.",
        "aiDraft": """Dear Hiring Manager,

I hope this email finds you well. I am writing to follow up on my application for the Product Manager position at Acme Corp, which I submitted approximately two weeks ago. I remain very enthusiastic about this opportunity and I wanted to reiterate my strong interest in the role. I believe my background in product development and my experience with agile methodologies make me a strong candidate for this position. I would welcome the opportunity to discuss how my skills and experience align with the needs of your team. I understand that the hiring process can take time, and I appreciate your consideration. If there is any additional information I can provide to support my application, please do not hesitate to let me know. I look forward to hearing from you.

Sincerely,
[Your Name]""",
        "userEdit": """Hi hiring team,

Following up on the Product Manager role I applied for 2 weeks ago (Ref: PM-992). Still very interested in the position. Do you need any additional portfolio links or references from my side?

Thanks,
[Your Name]"""
    },
    {
        "id": "professional-2",
        "context": "professional",
        "scenario": "time_off",
        "request": "Email my manager requesting three days off next month for a family wedding.",
        "aiDraft": """Dear [Manager's Name],

I hope you are doing well. I am writing to respectfully request some time off from work. My cousin is getting married next month, and the wedding celebration spans several days as it is a traditional ceremony with multiple events. The wedding is taking place out of state, so I will also need travel time. I would like to request three days of paid time off: October 15th, 16th, and 17th. I want to assure you that I will make every effort to complete all pending work before my absence and ensure a smooth handoff of any ongoing projects. I will coordinate with the team to make sure nothing falls through the cracks. I hope this won't cause too much inconvenience, and I truly appreciate your understanding. Please let me know if these dates would work or if there are any concerns.

Thank you for your consideration.

Best regards,
[Your Name]""",
        "userEdit": """Hi [Manager's Name],

I'd like to take PTO on Oct 15-17 for a family wedding. I'll make sure the sprint items are handed off to Sarah before I go and I'll be reachable for anything urgent.

Could you approve this in Workday when you get a chance?

Thanks,
[Your Name]"""
    },
    {
        "id": "professional-3",
        "context": "professional",
        "scenario": "decline_meeting",
        "request": "Politely decline a meeting invitation because of a conflict with another product review.",
        "aiDraft": """Dear [Inviter's Name],

I hope this message finds you well. I wanted to reach out regarding the meeting invitation you sent me for the upcoming session on Tuesday. Unfortunately, I regret to inform you that I will not be able to attend as I have a conflicting product review meeting that was previously scheduled at the same time. I sincerely apologize for any inconvenience this may cause, and I feel terrible about not being able to participate. I would be very interested in getting an update on what was discussed, so please let me know if there are any meeting notes or a recording available. If there is anything specific you need my input on beforehand, please let me know and I will make sure to provide it.

Best regards,
[Your Name]""",
        "userEdit": """I have a product review at the same time so I can't make this one. Could you share notes after? If there's anything you need input on from my side beforehand, happy to async in the project doc."""
    }
]

corrections = [
    {
        "id": "correction-professor-1",
        "pairId": "professor-1",
        "context": "professor",
        "rule": "Open with the factual situation (what happened), then immediately state your proposed solution with a specific date, then ask if that works — skip all apology preamble.",
        "avoid": [
            "I hope this email finds you well",
            "I sincerely apologize for the inconvenience",
            "I deeply regret any trouble this may cause",
            "I assure you it will not happen again",
            "I am currently working diligently"
        ],
        "prefer": [
            "State the problem in one sentence",
            "Propose a specific make-up date",
            "Ask about the process: 'Would that work, or is there a different process I should follow?'"
        ],
        "evidence": {
            "before": "I am writing to sincerely apologize for the inconvenience, but unfortunately, I will not be able to submit the assignment by the deadline. My laptop experienced a critical failure, and I lost a significant portion of my work. I deeply regret any trouble this may cause you, and I completely understand if there are penalties involved.",
            "after": "My laptop crashed and I lost my progress on the assignment. I'm redoing it now and can have it to you by Wednesday (two days past the deadline). Would that work, or is there a different process I should follow for late submissions?"
        }
    },
    {
        "id": "correction-professor-2",
        "pairId": "professor-2",
        "context": "professor",
        "rule": "When making a request of a professor, front-load the specific opportunity and deadline first, explicitly reference your past context with them (class, grade, project), and offer to send supporting documents.",
        "avoid": [
            "I hope you are doing well",
            "I have a very important request",
            "I feel that I have learned a great deal from you",
            "please let me know at your earliest convenience"
        ],
        "prefer": [
            "State MS/PhD program context and deadline in sentence one",
            "Mention the exact course, semester, and grade received",
            "Mention the specific research project context",
            "Propose sending CV/SOP package"
        ],
        "evidence": {
            "before": "I am planning to apply to graduate school this fall, and I was wondering if you would be willing to write a letter of recommendation on my behalf. I have really enjoyed your classes and feel that I have learned a great deal from you.",
            "after": "I'm applying to MS programs in computational biology this fall (deadline: Dec 15). Would you be willing to write a recommendation letter? I took your Molecular Systems course (Spring '25, A) and worked on the protein folding project in your lab last summer."
        }
    },
    {
        "id": "correction-professor-3",
        "pairId": "professor-3",
        "context": "professor",
        "rule": "For simple office-hours schedule changes, open with 'I have a conflict', state 2 specific alternative slots, and name the topic of discussion. Keep it under 4 sentences.",
        "avoid": [
            "I hope this message finds you well",
            "I wanted to reach out",
            "previously scheduled appointment",
            "I apologize for the inconvenience"
        ],
        "prefer": [
            "State 'I have a conflict during your office hours'",
            "Suggest specific slots: 'Monday after 2 or Thursday morning'",
            "Specify the topic: 'questions about the Ch. 7 material'"
        ],
        "evidence": {
            "before": "Unfortunately, I have a previously scheduled doctor's appointment that conflicts with your regular office hours time. I have been meaning to come see you to discuss some questions I have about the recent lecture material...",
            "after": "I have a conflict during your office hours this week. Could I stop by at a different time? I'm free Monday after 2 or Thursday morning. I have questions about the Ch. 7 material."
        }
    },
    {
        "id": "correction-friend-1",
        "pairId": "friend-1",
        "context": "friend",
        "rule": "For friends, match their energy — use lowercase, exclamation marks, emoji, and contractions. Lead with how you FEEL about the situation, not a formal notification, and immediately propose a specific make-up plan.",
        "avoid": [
            "I hope you're doing well",
            "I sincerely apologize for the inconvenience",
            "Please know that I will be thinking of you on your special day",
            "Best wishes"
        ],
        "prefer": [
            "Lowercase casual openers: 'hey!!'",
            "Express emotion directly: 'I'm SO bummed'",
            "Propose a concrete alternative: 'Can we do dinner or something the week after?'",
            "Use emoji naturally: ❤️ 🎂",
            "Sign off warmly without formality: 'happy early birthday ❤️'"
        ],
        "evidence": {
            "before": "I wanted to let you know that unfortunately, I will not be able to attend your birthday party this weekend. I feel really bad about missing your celebration and I sincerely apologize for the inconvenience.",
            "after": "I'm SO bummed but I can't make it saturday — finals are next week and I'm drowning lol. Can we do dinner or something the week after to celebrate? I'll get you a drink 🎂"
        }
    },
    {
        "id": "correction-friend-2",
        "pairId": "friend-2",
        "context": "friend",
        "rule": "When recommending media to a friend, use urgent/excited language ('you NEED to'), state the immediate impact on you, make a high-concept comparison, and give a specific recommendation context ('Apple TV', 'do it tonight').",
        "avoid": [
            "I wanted to recommend it to you",
            "It's a really interesting show",
            "I would highly recommend giving it a try when you have free time"
        ],
        "prefer": [
            "Open with: 'dude you NEED to watch [Title]'",
            "State personal reaction: 'my brain is broken'",
            "Provide high-concept analog: 'like if X met Y'",
            "Give instructions: 'don't look anything up, just go in blind'"
        ],
        "evidence": {
            "before": "I just finished watching Severance and I wanted to recommend it to you. It's a really interesting show that I think you would enjoy. The premise is quite unique and the acting is excellent.",
            "after": "dude you NEED to watch Severance. I just binged the whole thing and my brain is broken. it's like if The Office was a psychological thriller?? don't look anything up, just go in blind. trust me. apple tv. do it tonight."
        }
    },
    {
        "id": "correction-friend-3",
        "pairId": "friend-3",
        "context": "friend",
        "rule": "When asking a favor of a friend, ask the request directly in the first sentence, name the reward (pizza/beer), and explicitly use low-pressure sign-offs ('No pressure if you can't tho').",
        "avoid": [
            "I hope you're having a good week",
            "I wanted to reach out because I have a favor to ask",
            "I understand this is a big ask",
            "If you are available, I would really appreciate any help"
        ],
        "prefer": [
            "Ask directly: 'hey, are you free next Saturday?'",
            "Name the bribe: 'bribe you with pizza and beer'",
            "Low-pressure exit: 'No pressure if you can't tho!'"
        ],
        "evidence": {
            "before": "I wanted to reach out because I have a bit of a favor to ask. I'm moving to a new apartment next Saturday and I was wondering if you might be available to help me out. I understand this is a big ask and I completely understand if you have other commitments.",
            "after": "hey, are you free next saturday? I'm moving to the new place and could really use an extra pair of arms. Starting around 10. I'll bribe you with pizza and beer obviously. No pressure if you can't tho!"
        }
    },
    {
        "id": "correction-professional-1",
        "pairId": "professional-1",
        "context": "professional",
        "rule": "In a follow-up email, reference the specific job ID, skip the 'Hirining Manager' preamble, directly state you are still interested, and ask an active question about additional links/refs.",
        "avoid": [
            "Dear Hiring Manager",
            "I hope this email finds you well",
            "I remain very enthusiastic about this opportunity and I wanted to reiterate my strong interest",
            "I believe my background in product development..."
        ],
        "prefer": [
            "Casual professional opener: 'Hi hiring team'",
            "Reference specific role + ID in sentence one: 'Product Manager role... Ref: PM-992'",
            "Direct interest: 'Still very interested in the position'",
            "Closing question: 'Do you need any additional portfolio links or references...?'"
        ],
        "evidence": {
            "before": "Dear Hiring Manager, I hope this email finds you well. I am writing to follow up on my application for the Product Manager position at Acme Corp, which I submitted approximately two weeks ago. I remain very enthusiastic about this opportunity...",
            "after": "Hi hiring team, Following up on the Product Manager role I applied for 2 weeks ago (Ref: PM-992). Still very interested in the position. Do you need any additional portfolio links or references from my side?"
        }
    },
    {
        "id": "correction-professional-2",
        "pairId": "professional-2",
        "context": "professional",
        "rule": "For PTO requests, state the dates and reason in one sentence, proactively name who will cover your tasks, mention urgency availability, and end with a direct system approval call-to-action.",
        "avoid": [
            "Dear [Manager's Name]",
            "I hope you are doing well",
            "I am writing to respectfully request",
            "too much wedding detail (travel, traditional ceremony, cousin's wedding)",
            "I want to assure you that I will make every effort"
        ],
        "prefer": [
            "Propose dates directly: 'take PTO on Oct 15-17'",
            "Direct handoff coverage: 'handed off to Sarah'",
            "State reachability: 'reachable for anything urgent'",
            "System approval CTA: 'approve this in Workday'"
        ],
        "evidence": {
            "before": "I am writing to respectfully request some time off from work. My cousin is getting married next month, and the wedding celebration spans several days... I want to assure you that I will make every effort to complete all pending work before my absence...",
            "after": "Hi [Manager's Name], I'd like to take PTO on Oct 15-17 for a family wedding. I'll make sure the sprint items are handed off to Sarah before I go and I'll be reachable for anything urgent. Could you approve this in Workday when you get a chance?"
        }
    },
    {
        "id": "correction-professional-3",
        "pairId": "professional-3",
        "context": "professional",
        "rule": "When declining a meeting, state the conflict in one sentence without apologizing, ask for notes, and offer a specific async alternative rather than vague willingness to help.",
        "avoid": [
            "I regret to inform you",
            "I sincerely apologize for any inconvenience this may cause",
            "I feel terrible about not being able to participate",
            "With sincere apologies"
        ],
        "prefer": [
            "Simple conflict statement: 'I have a product review at the same time'",
            "Request notes directly: 'Could you share notes after?'",
            "Offer specific async next step: 'happy to async in the project doc'"
        ],
        "evidence": {
            "before": "Unfortunately, I regret to inform you that I will not be able to attend as I have a conflicting product review meeting that was previously scheduled at the same time. I sincerely apologize for any inconvenience this may cause, and I feel terrible about not being able to participate.",
            "after": "I have a product review at the same time so I can't make this one. Could you share notes after? If there's anything you need input on from my side beforehand, happy to async in the project doc."
        }
    }
]

transfer_tests = [
    {
        "context": "professor",
        "trainingPairId": "professor-1",
        "testRequest": "Ask my professor if I can switch my presentation slot from Tuesday to Thursday because my group partner is sick.",
        "scenario": "switch_presentation_slot"
    },
    {
        "context": "friend",
        "trainingPairId": "friend-1",
        "testRequest": "Tell my friend I just got promoted at work and want to celebrate.",
        "scenario": "share_promotion"
    },
    {
        "context": "professional",
        "trainingPairId": "professional-2",
        "testRequest": "Email my manager asking to work from home next week because my apartment is being renovated and it's too noisy.",
        "scenario": "wfh_request"
    }
]
