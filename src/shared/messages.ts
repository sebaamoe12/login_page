export const m = {
  // Nav
  nav: { dashboard: "Tableau de bord", employees: "Employés", payroll: "Paie", advances: "Avances", reports: "Rapports" },
  // Employee
  emp: {
    title: "Employés", add: "Ajouter un employé", cancel: "Annuler",
    firstName: "Prénom", lastName: "Nom", position: "Poste", hireDate: "Date d'embauche",
    salary: "Salaire", baseSalary: "Salaire de base", status: "Statut", actions: "Actions",
    active: "Actif", inactive: "Inactif", activate: "Activer", deactivate: "Désactiver",
    empty: "Aucun employé pour le moment", addSuccess: "Employé ajouté avec succès",
    selectPosition: "Sélectionner un poste", adding: "Ajout...", ajouter: "Ajouter",
  },
  // Advance
  adv: {
    title: "Avances sur salaire", newAdvance: "Nouvelle avance", cancel: "Annuler",
    employee: "Employé", amount: "Montant", type: "Type", reason: "Motif", date: "Date",
    status: "Statut", remaining: "Restant", actions: "Actions",
    approve: "Approuver", reject: "Refuser", markPaid: "Marquer payé", edit: "Modifier", delete: "Supprimer",
    all: "Toutes", pending: "EN ATTENTE", approved: "APPROUVÉE", rejected: "REJETÉE", paid: "PAYÉE",
    baseSalary: "Salaire de base", used: "Utilisé", remainingBalance: "Restant",
    submit: "Soumettre", submitting: "Soumission...", editTitle: "Modifier l'avance", deleteTitle: "Supprimer l'avance",
    deleteConfirm: "Êtes-vous sûr de vouloir supprimer cette avance ?",
    appliedToPayroll: "Liée à la paie — modification impossible",
    addSuccess: "Avance créée avec succès", editSuccess: "Avance modifiée", deleteSuccess: "Avance supprimée",
    approveSuccess: "Avance approuvée", rejectSuccess: "Avance rejetée", paySuccess: "Avance marquée payée",
    empty: "Aucune avance trouvée", search: "Rechercher un employé...",
  },
  // Payroll
  pay: {
    title: "Paie", payroll: "Paie", payAll: "Tout payer", payNow: "Payer",
    payEmployeeAll: "Tout payer pour", month: "Mois", baseSalary: "Salaire de base",
    advances: "Avances déduites", netSalary: "Net à payer", status: "Statut", payDay: "Jour de paie",
    months: "Mois", pending: "En attente", paid: "Payé", notDue: "Pas encore dû",
    search: "Rechercher un employé...", allPaid: "Tout est payé !",
    payAllSuccess: "Toutes les paies effectuées", paySuccess: "Paie effectuée",
    totalPending: "Total en attente", totalPaid: "Total payé",
    period: "Période", employees: "Employés", total: "Total",
  },
  // Reports
  rep: {
    title: "Rapports", totalEmployees: "Employés actifs", currentMonth: "Total du mois",
    historyTotal: "Historique total", period: "Période", employees: "Employés",
    totalAmount: "Montant total", employeeHistory: "Historique par employé",
    monthlyOverview: "Aperçu mensuel", empty: "Aucune donnée pour le moment",
  },
  // Dashboard
  dash: {
    welcome: "Bon retour", totalEmployees: "Total employés", activeEmployees: "Employés actifs",
    pendingAdvances: "Avances en attente", currentPayroll: "Paie en cours",
    notStarted: "Pas commencée", manageEmployees: "Gérer les employés",
    manageEmployeesDesc: "Ajouter, modifier ou consulter les employés",
    salaryAdvances: "Avances sur salaire", salaryAdvancesDesc: "Examiner et approuver les demandes",
    payrollRuns: "Gestion de la paie", payrollRunsDesc: "Créer et gérer les périodes de paie",
    notSetUp: "Base de données non configurée", notSetUpDesc: "Exécutez d'abord supabase_setup.sql dans l'éditeur SQL Supabase.",
  },
  // Common
  common: { loading: "Chargement...", error: "Erreur", success: "Succès", save: "Enregistrer", cancel: "Annuler", confirm: "Confirmer", close: "Fermer", DA: "DA" },
};
